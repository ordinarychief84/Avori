#!/usr/bin/env bash
# Admin disable flow + analytics rollup correctness.
set -uo pipefail
BASE="${1:-http://localhost:3000}"
JAR_A=/tmp/avori_admin.cookies
JAR_D=/tmp/avori_demo.cookies
PASS=0; FAIL=0
chk() {
  if [ "$2" = "$3" ]; then echo "  PASS $1 ($3)"; PASS=$((PASS+1));
  else echo "  FAIL $1 expected=$2 got=$3"; FAIL=$((FAIL+1)); fi
}
jget() {
  node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{let v=JSON.parse(s);for(const k of process.argv[1].split("."))if(v!=null)v=v[k];console.log(v??"")}catch(e){}})' "$1"
}
csrf() { curl -s -c "$1" -b "$1" "$BASE/api/auth/csrf" | jget csrfToken; }
login() {
  local email="$1" pw="$2" jar="$3"; rm -f "$jar"
  local CSRF; CSRF=$(csrf "$jar")
  curl -s -o /dev/null -c "$jar" -b "$jar" -X POST "$BASE/api/auth/callback/credentials?" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "csrfToken=$CSRF" --data-urlencode "email=$email" --data-urlencode "password=$pw" --data-urlencode "callbackUrl=/dashboard"
}

login admin@avori.dev password123 "$JAR_A"
login demo@avori.dev password123 "$JAR_D"
DEMO_BRAND=$(curl -s -b "$JAR_D" "$BASE/api/auth/session" | jget user.brandId)
SEED_VIDEO=seed-video-1

echo "== analytics rollup =="
BEFORE=$(curl -s -b "$JAR_D" "$BASE/api/brand/analytics")
B_IMP=$(echo "$BEFORE" | jget totals.impressions)
B_VIEW=$(echo "$BEFORE" | jget totals.views)
B_CTA=$(echo "$BEFORE" | jget totals.ctaClicks)
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -X POST -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" \
    -d "{\"brandId\":\"$DEMO_BRAND\",\"type\":\"IMPRESSION\",\"mode\":\"floating\"}" "$BASE/api/public/events"
done
for i in 1 2 3; do
  curl -s -o /dev/null -X POST -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" \
    -d "{\"brandId\":\"$DEMO_BRAND\",\"videoId\":\"$SEED_VIDEO\",\"type\":\"VIEW\"}" "$BASE/api/public/events"
done
for i in 1 2; do
  curl -s -o /dev/null -X POST -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" \
    -d "{\"brandId\":\"$DEMO_BRAND\",\"videoId\":\"$SEED_VIDEO\",\"productId\":\"seed-prod-1\",\"type\":\"CTA_CLICK\"}" "$BASE/api/public/events"
done
sleep 1
AFTER=$(curl -s -b "$JAR_D" "$BASE/api/brand/analytics")
chk "impressions +5" $((B_IMP+5)) "$(echo "$AFTER" | jget totals.impressions)"
chk "views +3"       $((B_VIEW+3)) "$(echo "$AFTER" | jget totals.views)"
chk "cta clicks +2"  $((B_CTA+2)) "$(echo "$AFTER" | jget totals.ctaClicks)"

echo "== admin disable brand =="
chk "PATCH disable brand" 200 "$(curl -s -b "$JAR_A" -o /dev/null -w %{http_code} -X PATCH -H 'Content-Type: application/json' -d '{"disabled":true}' "$BASE/api/admin/brands/$DEMO_BRAND")"
DISABLED=$(curl -s "$BASE/api/public/brand/$DEMO_BRAND/videos")
echo "$DISABLED" | grep -q '"brand":null' && { echo "  PASS disabled brand hidden"; PASS=$((PASS+1)); } || { echo "  FAIL disabled brand visible: $DISABLED"; FAIL=$((FAIL+1)); }
EVT=$(curl -s -X POST -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" \
  -d "{\"brandId\":\"$DEMO_BRAND\",\"type\":\"IMPRESSION\",\"mode\":\"floating\"}" "$BASE/api/public/events")
echo "$EVT" | grep -q '"accepted":false' && { echo "  PASS events rejected for disabled brand"; PASS=$((PASS+1)); } || { echo "  FAIL events accepted: $EVT"; FAIL=$((FAIL+1)); }
chk "re-enable brand" 200 "$(curl -s -b "$JAR_A" -o /dev/null -w %{http_code} -X PATCH -H 'Content-Type: application/json' -d '{"disabled":false}' "$BASE/api/admin/brands/$DEMO_BRAND")"

echo "== admin disable video =="
chk "PATCH disable video" 200 "$(curl -s -b "$JAR_A" -o /dev/null -w %{http_code} -X PATCH -H 'Content-Type: application/json' -d '{"disabled":true}' "$BASE/api/admin/videos/$SEED_VIDEO")"
PUB=$(curl -s "$BASE/api/public/brand/$DEMO_BRAND/videos")
[ -z "$(echo "$PUB" | jget videos.0.id)" ] && { echo "  PASS disabled video hidden"; PASS=$((PASS+1)); } || { echo "  FAIL disabled video still listed"; FAIL=$((FAIL+1)); }
chk "re-enable video" 200 "$(curl -s -b "$JAR_A" -o /dev/null -w %{http_code} -X PATCH -H 'Content-Type: application/json' -d '{"disabled":false}' "$BASE/api/admin/videos/$SEED_VIDEO")"

echo "== INACTIVE product hidden in widget payload =="
chk "set product INACTIVE" 200 "$(curl -s -b "$JAR_D" -o /dev/null -w %{http_code} -X PATCH -H 'Content-Type: application/json' -d '{"status":"INACTIVE"}' "$BASE/api/brand/products/seed-prod-1")"
PUB2=$(curl -s "$BASE/api/public/brand/$DEMO_BRAND/videos")
echo "$PUB2" | grep -q "Iced Latte Lip Balm" && { echo "  FAIL inactive product still in tags"; FAIL=$((FAIL+1)); } || { echo "  PASS inactive product hidden from tags"; PASS=$((PASS+1)); }
chk "set product ACTIVE" 200 "$(curl -s -b "$JAR_D" -o /dev/null -w %{http_code} -X PATCH -H 'Content-Type: application/json' -d '{"status":"ACTIVE"}' "$BASE/api/brand/products/seed-prod-1")"

echo "== public payload doesn't leak internal fields =="
PUB3=$(curl -s "$BASE/api/public/brand/$DEMO_BRAND/videos")
echo "$PUB3" | grep -q '"createdAt"' && { echo "  FAIL public leaks createdAt"; FAIL=$((FAIL+1)); } || { echo "  PASS no createdAt"; PASS=$((PASS+1)); }
echo "$PUB3" | grep -q '"updatedAt"' && { echo "  FAIL public leaks updatedAt"; FAIL=$((FAIL+1)); } || { echo "  PASS no updatedAt"; PASS=$((PASS+1)); }
echo "$PUB3" | grep -q '"passwordHash"' && { echo "  FAIL leaks passwordHash"; FAIL=$((FAIL+1)); } || { echo "  PASS no passwordHash"; PASS=$((PASS+1)); }

echo
echo "== ADMIN+EVENTS TOTAL: PASS=$PASS FAIL=$FAIL =="
[ "$FAIL" -gt 0 ] && exit 1 || exit 0

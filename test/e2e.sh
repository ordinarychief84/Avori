#!/usr/bin/env bash
# Avori end-to-end test harness.
# Hits the local dev server (default http://localhost:3000) and exercises:
#   smoke, auth, brand CRUD, cross-tenant, admin, events, upload security.
# Usage: bash test/e2e.sh [BASE_URL]

set -uo pipefail
BASE="${1:-http://localhost:3000}"
JAR_DEMO=/tmp/avori_demo.cookies
JAR_ADMIN=/tmp/avori_admin.cookies
rm -f "$JAR_DEMO" "$JAR_ADMIN"
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
    --data-urlencode "csrfToken=$CSRF" \
    --data-urlencode "email=$email" \
    --data-urlencode "password=$pw" \
    --data-urlencode "callbackUrl=/dashboard"
}

login demo@avori.dev password123 "$JAR_DEMO"
login admin@avori.dev password123 "$JAR_ADMIN"
DEMO_BRAND=$(curl -s -b "$JAR_DEMO" "$BASE/api/auth/session" | jget user.brandId)

echo "== smoke =="
for path in "/" "/login" "/signup" "/widget.js" "/brand/logo-mark.svg"; do
  chk "GET $path" 200 "$(curl -s -o /dev/null -w %{http_code} "$BASE$path")"
done

echo "== auth =="
chk "demo session role" "BRAND" "$(curl -s -b "$JAR_DEMO" "$BASE/api/auth/session" | jget user.role)"
chk "admin session role" "ADMIN" "$(curl -s -b "$JAR_ADMIN" "$BASE/api/auth/session" | jget user.role)"

echo "== middleware role gating =="
chk "anon -> /dashboard 307" 307 "$(curl -s -o /dev/null -w %{http_code} "$BASE/dashboard")"
chk "anon -> /admin 307"     307 "$(curl -s -o /dev/null -w %{http_code} "$BASE/admin")"
chk "BRAND -> /admin 307"    307 "$(curl -s -b "$JAR_DEMO" -o /dev/null -w %{http_code} "$BASE/admin")"

echo "== brand authed =="
for path in "/api/brand/products" "/api/brand/videos" "/api/brand/analytics" "/api/brand/me"; do
  chk "GET $path" 200 "$(curl -s -b "$JAR_DEMO" -o /dev/null -w %{http_code} "$BASE$path")"
done

echo "== brand anon rejected =="
for path in "/api/brand/products" "/api/brand/videos" "/api/brand/analytics"; do
  chk "anon $path -> 401" 401 "$(curl -s -o /dev/null -w %{http_code} "$BASE$path")"
done

echo "== validation =="
chk "POST products empty -> 400" 400 "$(curl -s -b "$JAR_DEMO" -o /dev/null -w %{http_code} -X POST -H 'Content-Type: application/json' -d '{}' "$BASE/api/brand/products")"

echo "== CRUD product =="
PROD_ID=$(curl -s -b "$JAR_DEMO" -X POST -H 'Content-Type: application/json' \
  -d '{"name":"E2E","price":9.99,"imageUrl":"https://x/e","productUrl":"https://example.com/e","status":"ACTIVE"}' \
  "$BASE/api/brand/products" | jget product.id)
[ -n "$PROD_ID" ] && { echo "  PASS product create"; PASS=$((PASS+1)); } || { echo "  FAIL product create"; FAIL=$((FAIL+1)); }
chk "PATCH product"  200 "$(curl -s -b "$JAR_DEMO" -o /dev/null -w %{http_code} -X PATCH -H 'Content-Type: application/json' -d '{"price":12.50}' "$BASE/api/brand/products/$PROD_ID")"
chk "DELETE product" 200 "$(curl -s -b "$JAR_DEMO" -o /dev/null -w %{http_code} -X DELETE "$BASE/api/brand/products/$PROD_ID")"

echo "== CRUD video + tag =="
P1=$(curl -s -b "$JAR_DEMO" -X POST -H 'Content-Type: application/json' \
  -d '{"name":"P1","price":1,"imageUrl":"https://x/1","productUrl":"https://example.com/1","status":"ACTIVE"}' \
  "$BASE/api/brand/products" | jget product.id)
V_ID=$(curl -s -b "$JAR_DEMO" -X POST -H 'Content-Type: application/json' \
  -d '{"title":"E2E","videoUrl":"https://example.com/v.mp4","status":"ACTIVE"}' \
  "$BASE/api/brand/videos" | jget video.id)
TAG_ID=$(curl -s -b "$JAR_DEMO" -X POST -H 'Content-Type: application/json' \
  -d "{\"productId\":\"$P1\",\"x\":50,\"y\":50,\"startTime\":0,\"endTime\":3}" \
  "$BASE/api/brand/videos/$V_ID/tags" | jget tag.id)
[ -n "$TAG_ID" ] && { echo "  PASS tag create"; PASS=$((PASS+1)); } || { echo "  FAIL tag create"; FAIL=$((FAIL+1)); }
chk "PATCH tag"  200 "$(curl -s -b "$JAR_DEMO" -o /dev/null -w %{http_code} -X PATCH -H 'Content-Type: application/json' -d '{"endTime":5}' "$BASE/api/brand/videos/$V_ID/tags/$TAG_ID")"
chk "DELETE tag" 200 "$(curl -s -b "$JAR_DEMO" -o /dev/null -w %{http_code} -X DELETE "$BASE/api/brand/videos/$V_ID/tags/$TAG_ID")"
chk "endTime<=startTime -> 400" 400 "$(curl -s -b "$JAR_DEMO" -o /dev/null -w %{http_code} -X POST -H 'Content-Type: application/json' -d "{\"productId\":\"$P1\",\"x\":50,\"y\":50,\"startTime\":5,\"endTime\":3}" "$BASE/api/brand/videos/$V_ID/tags")"
curl -s -b "$JAR_DEMO" -X DELETE "$BASE/api/brand/videos/$V_ID" > /dev/null
curl -s -b "$JAR_DEMO" -X DELETE "$BASE/api/brand/products/$P1" > /dev/null

echo "== events =="
chk "events ok" 200 "$(curl -s -o /dev/null -w %{http_code} -X POST -H 'Content-Type: application/json' -H 'Origin: http://example.com' -d "{\"brandId\":\"$DEMO_BRAND\",\"type\":\"IMPRESSION\",\"mode\":\"floating\"}" "$BASE/api/public/events")"

echo "== signup rate limit =="
LIMITED=0
for i in $(seq 1 10); do
  CODE=$(curl -s -o /dev/null -w %{http_code} -X POST -H 'Content-Type: application/json' \
    -d "{\"email\":\"rl-$(date +%s)-$i@example.com\",\"password\":\"password123\",\"brandName\":\"RL$i\"}" \
    "$BASE/api/signup")
  [ "$CODE" = "429" ] && { LIMITED=$i; break; }
done
[ "$LIMITED" -gt 0 ] && [ "$LIMITED" -le 7 ] && { echo "  PASS signup rate-limited at #$LIMITED"; PASS=$((PASS+1)); } || { echo "  FAIL signup rate limit (#$LIMITED)"; FAIL=$((FAIL+1)); }

echo "== signup duplicate email gives generic error =="
SIGNUP_DUP=$(curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"email":"demo@avori.dev","password":"password123","brandName":"Dup"}' \
  "$BASE/api/signup")
echo "$SIGNUP_DUP" | grep -qi "already\|registered\|exists" && { echo "  FAIL signup leaks email existence: $SIGNUP_DUP"; FAIL=$((FAIL+1)); } || { echo "  PASS signup gives generic error"; PASS=$((PASS+1)); }

TMPDIR_LOCAL="${TMPDIR:-$(node -e "console.log(require('os').tmpdir())")}"
FAKE_PNG="$TMPDIR_LOCAL/avori-fake.png"
REAL_PNG="$TMPDIR_LOCAL/avori-real.png"
FAKE_JPG="$TMPDIR_LOCAL/avori-fake.jpg"

echo "== upload: fake PNG (HTML payload) rejected =="
printf '<script>alert(1)</script>' > "$FAKE_PNG"
FAKE=$(curl -s -b "$JAR_DEMO" -X POST -F "kind=image" -F "file=@$FAKE_PNG;type=image/png" "$BASE/api/brand/upload")
echo "$FAKE" | grep -q '"error"' && { echo "  PASS fake png rejected ($FAKE)"; PASS=$((PASS+1)); } || { echo "  FAIL fake png accepted: $FAKE"; FAIL=$((FAIL+1)); }

echo "== upload: real PNG accepted =="
node -e "const b=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNkYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==','base64');require('fs').writeFileSync(process.argv[1],b);" "$REAL_PNG"
REAL=$(curl -s -b "$JAR_DEMO" -X POST -F "kind=image" -F "file=@$REAL_PNG;type=image/png" "$BASE/api/brand/upload")
URL=$(echo "$REAL" | jget url)
echo "$REAL" | grep -q '"url":"/uploads/' && { echo "  PASS real PNG accepted ($URL)"; PASS=$((PASS+1)); } || { echo "  FAIL real PNG rejected: $REAL"; FAIL=$((FAIL+1)); }
echo "$URL" | grep -qE '\.png$' && { echo "  PASS server-derived .png ext"; PASS=$((PASS+1)); } || { echo "  FAIL bad ext: $URL"; FAIL=$((FAIL+1)); }

echo "== uploaded file served with nosniff + CSP sandbox =="
HEADERS=$(curl -sI "$BASE$URL")
echo "$HEADERS" | grep -i "X-Content-Type-Options" | grep -qi nosniff && { echo "  PASS nosniff present"; PASS=$((PASS+1)); } || { echo "  FAIL nosniff missing (headers: $(echo "$HEADERS" | head -20))"; FAIL=$((FAIL+1)); }
echo "$HEADERS" | grep -i "Content-Security-Policy" | grep -qi sandbox && { echo "  PASS CSP sandbox present"; PASS=$((PASS+1)); } || { echo "  FAIL CSP sandbox missing"; FAIL=$((FAIL+1)); }

echo "== upload: mp4 bytes labelled image/jpeg rejected =="
node -e "const h=Buffer.from([0,0,0,0x14,0x66,0x74,0x79,0x70,0x69,0x73,0x6f,0x6d]);require('fs').writeFileSync(process.argv[1],h);" "$FAKE_JPG"
WRONG=$(curl -s -b "$JAR_DEMO" -X POST -F "kind=image" -F "file=@$FAKE_JPG;type=image/jpeg" "$BASE/api/brand/upload")
echo "$WRONG" | grep -q '"error"' && { echo "  PASS mp4 disguised as jpeg rejected"; PASS=$((PASS+1)); } || { echo "  FAIL mp4 disguised slipped through: $WRONG"; FAIL=$((FAIL+1)); }

echo "== admin =="
for path in "/api/admin/brands" "/api/admin/videos" "/api/admin/products"; do
  chk "admin $path 200" 200 "$(curl -s -b "$JAR_ADMIN" -o /dev/null -w %{http_code} "$BASE$path")"
done
chk "BRAND -> /api/admin/brands 403" 403 "$(curl -s -b "$JAR_DEMO" -o /dev/null -w %{http_code} "$BASE/api/admin/brands")"

echo "== ownership 404 =="
chk "bogus product PATCH 404" 404 "$(curl -s -b "$JAR_DEMO" -o /dev/null -w %{http_code} -X PATCH -H 'Content-Type: application/json' -d '{"name":"x"}' "$BASE/api/brand/products/no-such-id")"

echo
echo "== TOTAL: PASS=$PASS FAIL=$FAIL =="
[ "$FAIL" -gt 0 ] && exit 1 || exit 0

#!/usr/bin/env bash
# Cross-tenant security battery: brand B cannot read or mutate brand A's data.
set -uo pipefail
BASE="${1:-http://localhost:3000}"
JAR_A=/tmp/avori_a.cookies
JAR_B=/tmp/avori_b.cookies
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

login demo@avori.dev password123 "$JAR_A"
A_BRAND=$(curl -s -b "$JAR_A" "$BASE/api/auth/session" | jget user.brandId)
A_PROD=$(curl -s -b "$JAR_A" -X POST -H 'Content-Type: application/json' \
  -d '{"name":"A-Secret","price":1,"imageUrl":"https://x/a","productUrl":"https://example.com/a","status":"ACTIVE"}' \
  "$BASE/api/brand/products" | jget product.id)
A_VID=$(curl -s -b "$JAR_A" -X POST -H 'Content-Type: application/json' \
  -d '{"title":"A","videoUrl":"https://example.com/a.mp4","status":"ACTIVE"}' \
  "$BASE/api/brand/videos" | jget video.id)

EMAIL_B="ct-test-$(date +%s)@avori.dev"
SIGNUP=$(curl -s -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_B\",\"password\":\"password123\",\"brandName\":\"Brand-B\"}" \
  "$BASE/api/signup")
B_BRAND=$(echo "$SIGNUP" | jget brandId)
[ -n "$B_BRAND" ] && [ "$A_BRAND" != "$B_BRAND" ] && { echo "  PASS distinct brand ids"; PASS=$((PASS+1)); } || { echo "  FAIL brand ids: A=$A_BRAND B=$B_BRAND"; FAIL=$((FAIL+1)); }

login "$EMAIL_B" password123 "$JAR_B"
chk "B login role" "BRAND" "$(curl -s -b "$JAR_B" "$BASE/api/auth/session" | jget user.role)"

chk "B GET A.product 404"    404 "$(curl -s -b "$JAR_B" -o /dev/null -w %{http_code} "$BASE/api/brand/products/$A_PROD")"
chk "B PATCH A.product 404"  404 "$(curl -s -b "$JAR_B" -o /dev/null -w %{http_code} -X PATCH -H 'Content-Type: application/json' -d '{"name":"hijacked"}' "$BASE/api/brand/products/$A_PROD")"
chk "B DELETE A.product 404" 404 "$(curl -s -b "$JAR_B" -o /dev/null -w %{http_code} -X DELETE "$BASE/api/brand/products/$A_PROD")"
chk "B GET A.video 404"      404 "$(curl -s -b "$JAR_B" -o /dev/null -w %{http_code} "$BASE/api/brand/videos/$A_VID")"
chk "B PATCH A.video 404"    404 "$(curl -s -b "$JAR_B" -o /dev/null -w %{http_code} -X PATCH -H 'Content-Type: application/json' -d '{"title":"x"}' "$BASE/api/brand/videos/$A_VID")"
chk "B tag A.video 404"      404 "$(curl -s -b "$JAR_B" -o /dev/null -w %{http_code} -X POST -H 'Content-Type: application/json' -d "{\"productId\":\"$A_PROD\",\"x\":1,\"y\":1,\"startTime\":0,\"endTime\":1}" "$BASE/api/brand/videos/$A_VID/tags")"

B_VID=$(curl -s -b "$JAR_B" -X POST -H 'Content-Type: application/json' \
  -d '{"title":"Bv","videoUrl":"https://example.com/bv.mp4","status":"ACTIVE"}' \
  "$BASE/api/brand/videos" | jget video.id)
chk "B tag B.video w/ A.product 404" 404 "$(curl -s -b "$JAR_B" -o /dev/null -w %{http_code} -X POST -H 'Content-Type: application/json' -d "{\"productId\":\"$A_PROD\",\"x\":1,\"y\":1,\"startTime\":0,\"endTime\":1}" "$BASE/api/brand/videos/$B_VID/tags")"

LIST=$(curl -s -b "$JAR_B" "$BASE/api/brand/products")
echo "$LIST" | grep -q "$A_PROD" && { echo "  FAIL B sees A's product in list"; FAIL=$((FAIL+1)); } || { echo "  PASS B's list excludes A's product"; PASS=$((PASS+1)); }

# cleanup
curl -s -b "$JAR_A" -o /dev/null -X DELETE "$BASE/api/brand/products/$A_PROD"
curl -s -b "$JAR_A" -o /dev/null -X DELETE "$BASE/api/brand/videos/$A_VID"
curl -s -b "$JAR_B" -o /dev/null -X DELETE "$BASE/api/brand/videos/$B_VID"

echo
echo "== CROSS-TENANT TOTAL: PASS=$PASS FAIL=$FAIL =="
[ "$FAIL" -gt 0 ] && exit 1 || exit 0

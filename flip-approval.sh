#!/usr/bin/env bash
# Flip a Dynamic Media asset's OpenAPI delivery approval (Review Status) WITHOUT the AEM UI dropdown.
# Sets dam:status (= the "Review Status" property) and publishes, so the asset appears/disappears
# on the OpenAPI delivery tier. Use this for demo 18 (Approval-gated delivery).
#
#   ./flip-approval.sh approve   whistler-1
#   ./flip-approval.sh unapprove whistler-1
#   ./flip-approval.sh approve   /content/dam/aem-demo-assets/en/.../asset.jpg   <uuid>
#
# Reads credentials + hosts from a local .env (copy .env.example -> .env). .env is gitignored.
# Keys map to the demo-18 assets: forest-trail | surfer | whistler-1 | whistler-2
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; ENVF="$ROOT/.env"
[ -f "$ENVF" ] || { echo "Missing $ENVF — copy .env.example to .env and fill it in."; exit 1; }
val(){ grep -m1 "^$1=" "$ENVF" | tr -d '\r' | sed 's/^[^=]*=//; s/"//g; s:/$::'; }
INSTANCE=$(val INSTANCE_URL)
AUSER=$(val USER)
APASS=$(val PASSWORD)
DELIVERY_HOST=$(val DELIVERY_HOST)
DELIV="https://${DELIVERY_HOST}/adobe/assets"

ACTION="${1:-}"; KEY="${2:-}"; ARG_UUID="${3:-}"
case "$KEY" in
  forest-trail) AP="/content/dam/aem-demo-assets/en/activities/cycling/forest-trail.jpg"; U="8c18286d-c218-4efc-aa07-35d846406079";;
  surfer)       AP="/content/dam/aem-demo-assets/en/adventures/surf-camp-in-costa-rica/surfing_2.jpg"; U="77ed958c-9433-471d-9b37-f770de400bf2";;
  whistler-1)   AP="/content/dam/aem-demo-assets/en/adventures/whistler-mountain-biking/adobestock-122578479.jpeg"; U="5925e6b9-9f35-4da3-a2f9-d6227216394b";;
  whistler-2)   AP="/content/dam/aem-demo-assets/en/adventures/whistler-mountain-biking/adobestock-122615840.jpeg"; U="f75700fb-7366-431c-b1e1-608de4d76eee";;
  /content/*)   AP="$KEY"; U="$ARG_UUID";;
  *) echo "usage: flip-approval.sh approve|unapprove <forest-trail|surfer|whistler-1|whistler-2|/content/dam/...path> [uuid]"; exit 1;;
esac
STATUS=approved; [ "$ACTION" = "unapprove" ] && STATUS=unapproved
[ "$ACTION" = "approve" ] || [ "$ACTION" = "unapprove" ] || { echo "first arg must be approve or unapprove"; exit 1; }

echo "→ set Review Status (dam:status) = $STATUS  on  $(basename "$AP")"
curl -su "$AUSER:$APASS" -X POST "$INSTANCE$AP/jcr:content/metadata" --data-urlencode "dam:status=$STATUS" -o /dev/null -w "   metadata POST: %{http_code}\n"
curl -su "$AUSER:$APASS" -X POST "$INSTANCE/bin/replicate.json" --data-urlencode cmd=Activate --data-urlencode "path=$AP" -o /dev/null -w "   publish:       %{http_code}\n"
if [ -n "$U" ]; then
  echo "→ waiting for delivery to propagate…"; sleep 12
  code=$(curl -s -o /dev/null -w "%{http_code}" "$DELIV/urn:aaid:aem:$U/as/img.jpg?width=300")
  echo "   OpenAPI delivery now: HTTP $code  ($([ "$code" = 200 ] && echo DELIVERED || echo 'not available'))"
  echo "   $DELIV/urn:aaid:aem:$U/as/img.jpg?width=300"
fi
echo "Done. Re-check demo 18 to see the change."

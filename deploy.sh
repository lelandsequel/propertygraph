#!/bin/bash
# PropertyGraph deploy guard
# propertygraph.io is LOCKED to dpl_AQrFHTKYanUt2vduTimprKE9Bmjv
# DO NOT deploy without TJ explicit approval
# The good UI must stay live. Any new deploy MUST be tested on preview first.

echo "⚠️  STOP. Read this before deploying PropertyGraph."
echo ""
echo "propertygraph.io is locked to a known-good deployment."
echo "Deploying --prod will REPLACE the live UI."
echo ""
echo "Steps:"
echo "  1. Deploy to PREVIEW first:  vercel --token <token>"
echo "  2. Check the preview URL looks correct"
echo "  3. Only then promote: vercel promote <deployment-url> --scope lelandsequel-0aae5153"
echo ""
echo "If you're sure, run with: FORCE_DEPLOY=1 ./deploy.sh"
echo ""

if [ "$FORCE_DEPLOY" != "1" ]; then
  exit 1
fi

cd apps/web
vercel --prod --token vcp_25XXpkllt3NTRGX6jRAUJNPSKTtk71ViSlGSZH8l7DCB7tfVIX4DPYz1

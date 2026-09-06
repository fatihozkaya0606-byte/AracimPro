#!/data/data/com.termux/files/usr/bin/bash
set -e
KEY_DIR=${1:-$HOME/storage/downloads/AracimProUploadKey}
KEY_FILE="$KEY_DIR/upload-key.jks"
INFO_FILE="$KEY_DIR/KEY_INFO.txt"
if [ ! -f "$KEY_FILE" ] || [ ! -f "$INFO_FILE" ]; then
  echo "HATA: $KEY_DIR içinde upload-key.jks ve KEY_INFO.txt bulunamadı"
  exit 1
fi
STORE_PASSWORD=$(sed -n 's/^Store password: //p' "$INFO_FILE")
KEY_ALIAS=$(sed -n 's/^Alias: //p' "$INFO_FILE")
KEY_PASSWORD=$(sed -n 's/^Key password: //p' "$INFO_FILE")
KEY_B64=$(base64 "$KEY_FILE" | tr -d '\n')

gh auth status >/dev/null
gh secret set PLAY_UPLOAD_KEYSTORE_B64 -b "$KEY_B64"
gh secret set PLAY_UPLOAD_STORE_PASSWORD -b "$STORE_PASSWORD"
gh secret set PLAY_UPLOAD_KEY_ALIAS -b "$KEY_ALIAS"
gh secret set PLAY_UPLOAD_KEY_PASSWORD -b "$KEY_PASSWORD"
echo "Google Play signing secrets GitHub reposuna kaydedildi."

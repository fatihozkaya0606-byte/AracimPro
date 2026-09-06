#!/data/data/com.termux/files/usr/bin/bash
set -e
KEY_FILE=${1:-$HOME/storage/downloads/AracimProUploadKey/upload-key.jks}
INFO_FILE=${2:-$HOME/storage/downloads/AracimProUploadKey/KEY_INFO.txt}
if [ ! -f "$KEY_FILE" ] || [ ! -f "$INFO_FILE" ]; then
  echo "Upload key veya KEY_INFO.txt bulunamadı"
  exit 1
fi
STORE_PASSWORD=$(sed -n 's/^Store password: //p' "$INFO_FILE")
KEY_ALIAS=$(sed -n 's/^Alias: //p' "$INFO_FILE")
KEY_PASSWORD=$(sed -n 's/^Key password: //p' "$INFO_FILE")
cat > keystore.properties <<EOF2
storeFile=$KEY_FILE
storePassword=$STORE_PASSWORD
keyAlias=$KEY_ALIAS
keyPassword=$KEY_PASSWORD
EOF2
echo "keystore.properties oluşturuldu. Bu dosyayı GitHub'a yüklemeyin."

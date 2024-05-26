BUCKET_NAME="urban-view"
export BUCKET_ACCESS_KEY="YCAJEAzi-y_oJfcPXWSjHS49b"
export BUCKET_SECRET_KEY="YCNu9UyqdftLPw77-b51Fw75Gc44mmhtT3mdIT0K"

npm ci
npm version patch
npm run build

s3cmd --access_key=${BUCKET_ACCESS_KEY} --secret_key=${BUCKET_SECRET_KEY} --host="storage.yandexcloud.net" --host-bucket="%(bucket)s.storage.yandexcloud.net" sync dist/ s3://${BUCKET_NAME}/
s3cmd --access_key=${BUCKET_ACCESS_KEY} --secret_key=${BUCKET_SECRET_KEY} --host="storage.yandexcloud.net" --host-bucket="%(bucket)s.storage.yandexcloud.net" -r modify --add-header=content-type:application/javascript s3://${BUCKET_NAME}/js/
s3cmd --access_key=${BUCKET_ACCESS_KEY} --secret_key=${BUCKET_SECRET_KEY} --host="storage.yandexcloud.net" --host-bucket="%(bucket)s.storage.yandexcloud.net" -r modify --add-header=content-type:text/css s3://${BUCKET_NAME}/css/
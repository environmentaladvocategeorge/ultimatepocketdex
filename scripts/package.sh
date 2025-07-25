#!/bin/bash

set -e

ROLE_ARN="$1"
ACCOUNT_ID="$2"
ENVIRONMENT="$3"
BUCKET_NAME="ultimatepocketdex-sam-${ENVIRONMENT}"
MODEL_BUCKET_NAME="ultimatepocketdex-openclip-model-${ENVIRONMENT}"
REGION="us-east-1"

# -------------------------------
# Ensure SAM bucket exists
# -------------------------------
if ! aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null; then
  echo "Bucket does not exist. Creating bucket: $BUCKET_NAME"
  aws s3api create-bucket --bucket $BUCKET_NAME --region $REGION

  aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {"AWS": "'"$ROLE_ARN"'"},
        "Action": ["s3:GetObject", "s3:PutObject"],
        "Resource": "arn:aws:s3:::'"$BUCKET_NAME"'/*",
        "Condition": {
          "StringEquals": {
            "aws:PrincipalAccount": "'"$ACCOUNT_ID"'"
          }
        }
      },
      {
        "Effect": "Allow",
        "Principal": {"Service": "cloudformation.amazonaws.com"},
        "Action": ["s3:GetObject", "s3:PutObject"],
        "Resource": "arn:aws:s3:::'"$BUCKET_NAME"'/*",
        "Condition": {
          "StringEquals": {
            "aws:PrincipalAccount": "'"$ACCOUNT_ID"'"
          }
        }
      }
    ]
  }'
else
  echo "Bucket already exists: $BUCKET_NAME"
fi

# -------------------------------
# Ensure Model bucket exists
# -------------------------------
if ! aws s3api head-bucket --bucket $MODEL_BUCKET_NAME 2>/dev/null; then
  echo "Model bucket does not exist. Creating bucket: $MODEL_BUCKET_NAME"
  aws s3api create-bucket --bucket $MODEL_BUCKET_NAME --region $REGION
else
  echo "Model bucket already exists: $MODEL_BUCKET_NAME"
fi

# -------------------------------
# Package and upload model
# -------------------------------
echo "Packaging CLIP model..."
cd clip_model
tar czvf model.tar.gz code
cd ..

echo "Uploading model to S3..."
aws s3 cp clip_model/model.tar.gz s3://$MODEL_BUCKET_NAME/model.tar.gz

# -------------------------------
# Build the SAM application
# -------------------------------
echo "Building SAM application..."
if sam build --template-file cloudformation/template.yml; then
  echo "SAM application built successfully."
else
  echo "Failed to build SAM application."
  exit 1
fi

# -------------------------------
# Package the SAM application
# -------------------------------
echo "Packaging SAM application..."
if sam package \
  --output-template-file packaged.yaml \
  --s3-bucket $BUCKET_NAME; then
  echo "SAM application packaged successfully."
else
  echo "Failed to package SAM application."
  exit 1
fi

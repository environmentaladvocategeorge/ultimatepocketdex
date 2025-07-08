set -e

ASSUMED_ROLE_ARN=$1
ACCOUNT_ID=$2
ENVIRONMENT=$3
RESOURCE_BASE_IDENTIFIER="ultimatepocketdex"
STACK_NAME="${RESOURCE_BASE_IDENTIFIER}-${ENVIRONMENT}"
REGION="us-east-1"

STACK_STATUS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].StackStatus" --output text || echo "NOT_FOUND")

if [[ "$STACK_STATUS" == "ROLLBACK_COMPLETE" ]]; then
  echo "Stack is in ROLLBACK_COMPLETE state. Deleting the stack..."
  aws cloudformation delete-stack --stack-name $STACK_NAME --region $REGION
  echo "Waiting for stack deletion to complete..."
  aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME --region $REGION
elif [[ "$STACK_STATUS" != "NOT_FOUND" ]]; then
  echo "Stack is in status: $STACK_STATUS. Proceeding with deployment."
else
  echo "Stack not found. Proceeding with deployment."
fi

echo "Deploying SAM application..."
sam deploy \
  --template-file packaged.yaml \
  --stack-name $STACK_NAME \
  --parameter-overrides Environment=${ENVIRONMENT} DeploymentRoleARN=${ASSUMED_ROLE_ARN} ResourceBaseIdentifier=${RESOURCE_BASE_IDENTIFIER} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --region $REGION

echo "Deployment complete."

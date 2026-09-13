/**
 * Realistic Multi-Line CloudWatch & Application Log Examples
 * For quick testing of the CloudWatch Log Analyzer feature.
 */

export const EXAMPLE_LOGS = {
  lambdaTimeout: {
    id: 'lambda-timeout',
    title: 'Lambda Timeout',
    description: 'Task timed out after 30.00 seconds during downstream API processing',
    logs: `2026-09-13T10:14:02.104Z START RequestId: 4f3b18d2-7c91-49e3-a128-d8902ef19bc4 Version: $LATEST
2026-09-13T10:14:02.320Z [INFO] Processing order payload: orderId=ord_98721 customer=cust_4421
2026-09-13T10:14:02.450Z [INFO] Calling external payment gateway endpoint https://api.payments-provider.internal/v2/charge
2026-09-13T10:14:17.500Z [WARN] Retrying payment call attempt 2 after socket connection hang...
2026-09-13T10:14:32.105Z 4f3b18d2-7c91-49e3-a128-d8902ef19bc4 Task timed out after 30.00 seconds
2026-09-13T10:14:32.106Z END RequestId: 4f3b18d2-7c91-49e3-a128-d8902ef19bc4
2026-09-13T10:14:32.107Z REPORT RequestId: 4f3b18d2-7c91-49e3-a128-d8902ef19bc4 Duration: 30000.00 ms Billed Duration: 30000 ms Memory Size: 256 MB Max Memory Used: 118 MB Init Duration: 180.25 ms`,
  },

  apiGateway5xx: {
    id: 'apigateway-5xx',
    title: 'API Gateway 5xx',
    description: 'HTTP 502 Bad Gateway due to integration endpoint network failure',
    logs: `2026-09-13T11:05:41.012Z (7b2a9c14-55f1-4e89-8d19-9012f451bcf8) Verifying Request Headers and Request Path parameters
2026-09-13T11:05:41.013Z (7b2a9c14-55f1-4e89-8d19-9012f451bcf8) Starting execution for httpMethod: POST, resourcePath: /v1/checkout
2026-09-13T11:05:41.014Z (7b2a9c14-55f1-4e89-8d19-9012f451bcf8) Sending request to https://internal-alb-vpc-99214.ap-south-1.elb.amazonaws.com:8443/checkout
2026-09-13T11:05:51.025Z (7b2a9c14-55f1-4e89-8d19-9012f451bcf8) Execution failed due to configuration error: There was an internal error completing your request. Endpoint connection timed out after 10000 ms.
2026-09-13T11:05:51.026Z (7b2a9c14-55f1-4e89-8d19-9012f451bcf8) Method completed with status: 502
2026-09-13T11:05:51.027Z (7b2a9c14-55f1-4e89-8d19-9012f451bcf8) AWS Integration Latency: 10001 ms, API Gateway Total Latency: 10014 ms`,
  },

  appError: {
    id: 'app-error',
    title: 'Application Error',
    description: 'Unhandled Python exception KeyError and memory exhaustion in container',
    logs: `2026-09-13T12:22:18.450Z [app-main] INFO: Received batch request batch_id=b_77192 count=500 items
2026-09-13T12:22:19.120Z [app-main] ERROR: Traceback (most recent call last):
  File "/var/task/app/handler.py", line 88, in process_batch
    tenant_config = tenants_map[item["tenant_id"]]
KeyError: 'tenant_enterprise_apac'
2026-09-13T12:22:19.121Z [app-main] CRITICAL: Process encountered unrecoverable fatal error during batch transform
2026-09-13T12:22:19.122Z [app-main] ERROR: Exception caused container SIGKILL exit code 137 (OOMKilled)
2026-09-13T12:22:19.200Z [ecs-agent] Task ecs-task-orders-01 stopped with exit code 137: Container failed memory limit check`,
  },

  dbConnectionError: {
    id: 'db-connection-error',
    title: 'Database Connection Error',
    description: 'PostgreSQL Aurora connection pool exhausted and connection timed out',
    logs: `2026-09-13T14:45:01.300Z [db-pool] WARN: Active pool connections reached 100/100 limit. Waiting for available connection...
2026-09-13T14:45:16.305Z [db-pool] ERROR: TimeoutError: Connection acquisition timeout after 15000ms. Max connections (100) exhausted.
2026-09-13T14:45:16.310Z [db-client] ERROR: psycopg2.OperationalError: could not connect to server: Connection timed out
	Is the server running on host "aurora-pg-cluster.cluster-c99214.ap-south-1.rds.amazonaws.com" (10.0.4.15) and accepting
	TCP/IP connections on port 5432?
2026-09-13T14:45:16.315Z [app] FATAL: Unable to initialize tenant read transaction. Aborting request.`,
  },
};

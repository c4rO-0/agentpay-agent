# Prepare your Provider execution database

The reference application requires MySQL execution storage. The installation guide prepares and verifies it before declaring installation complete. It stores execution/retry evidence in **your
own** database. You do not need AgentPay platform database credentials.

## If you already have a database

Ask your database administrator for its host, port, database name, login and password.
Use a dedicated execution database. The server needs table creation plus SELECT,
INSERT, UPDATE and DELETE privileges there. It initializes the schema on startup.
The installation guide saves the hidden password in private `storage.env` at mode `0600`; it is never uploaded to Market or Settlement. The AgentPay connection wizard does not ask for it.

Application administrators verify SQL connectivity and schema/write privileges separately. The connection wizard performs no SQL checks.

## If you do not have a database

Ask your own host/database administrator to provision MySQL and the dedicated database
and login before continuing. An example for that administrator, using their existing
MySQL administrative session and replacing every example value:

```sql
CREATE DATABASE provider_random;
CREATE USER 'provider_random'@'127.0.0.1' IDENTIFIED BY 'REPLACE_WITH_A_PRIVATE_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX
ON provider_random.* TO 'provider_random'@'127.0.0.1';
```

The allowed client host must match your actual connection/deployment; remote databases
need the administrator's appropriate host and transport setup. These commands are not
run by the guide and must not be applied to the platform's database. Creating a fresh
database is for a new service. Do not replace a running service's execution database
and lose its recovery records.

For the private rehearsal, obtain the Provider-owned database details from the
rehearsal operator. The public platform configuration intentionally contains no
passwords or database logins. Do not guess the platform MySQL port/credentials.

## If the guide reports a problem

| Error | Next action |
| --- | --- |
| Connection refused | Check your database server, host and port |
| Access denied | Ask your database administrator to check login/password and allowed host |
| Unknown database | Have your administrator create the named execution database |
| Database access denied | Have your administrator grant access to that dedicated database |
| Startup/schema error | Check CREATE/ALTER/INDEX and runtime write privileges; inspect your private Provider process log |

For unfinished installation, rerun the installation guide: non-secret draft
answers are retained and the password is requested again. To correct saved values,
stop the guide and edit only the application's private storage configuration.
Preserve any existing execution database; moving it requires separate planning.
The connection wizard does not contain a database editor.

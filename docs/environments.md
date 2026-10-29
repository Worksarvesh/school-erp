# Environment separation

| Environment | Purpose                                     | Database                              | Deploy                                 |
| ----------- | ------------------------------------------- | ------------------------------------- | -------------------------------------- |
| local       | Developer machines                          | Local or personal dev database        | Manual                                 |
| staging     | Pre-release verification, test schools only | Separate database/project             | Automatic from `main` (when CD exists) |
| production  | Real schools                                | Separate database/project, backups on | Manual approval required               |

Rules: separate database and credentials per environment; no production data in dev or staging; staging uses synthetic data; each environment has its own secrets.

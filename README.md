# Flow

# Database structure docs

**Common fields for records**
| Name       | Type      | Description               |
| :--------- | :-------- | :------------------------ |
| created_at | timestamp | Record creation timestamp |
| updated_at | timestamp | Record update timestamp   |

## Employee Data *Schema: employee*

**Table:** user

| Name       | Type      | Description          | Values |
| :--------- | :-------- | :------------------- | :----- |
| uuid       | string    | User ID              |
| last_login | timestamp | Last login timestamp |


**Table:** employee

| Name         | Type   | Description              | Values                      |
| :----------- | :----- | :----------------------- | :-------------------------- |
| uuid         | string | User ID                  |
| has_approval | string | If approved by org admin | ACCEPTED, PENDING, REJECTED |
| is_active    | bool   | Is user active           |
| email        | string | E-mail                   |
| company_id   | int    | Company ID               |
| first_name   | string | First Name               |
| last_name    | string | Last Name                |
| phone_number | string | Phone Number             |
| hire_date    | date   | Joining Date             |

# Project Title: Bill Buddy
## Tech Scack Used :
- Node/ExpressJS
- Mongo DB
- Postman (For API Testing purpose)
- PDFKit (For balance sheet generation)
## **Download** the entire repo via zip or dlone this repo locally
## Igniting the server
### Steps to do :
- Install the packages (this command automatically installs the packages mentioned in package.json)
```
npm i
```
- Create an **.env file** and add your MongoDB URI as MONGODB_URI.
- Ingnite the server using this below command
  ``` nodemon server.js ```
- After successful ignition, we can install **POSTMAN** Vscode Extension
- Now, we can try out the backend endpoints mentioned above in every controller file.
## Points to consider
- For MongoDB, create your own cluster using MongoDB Atlas Clusters and get credentials(username, password) for this cluster and use them inside this application(in .env file @ MONGODB_URI).
- For better understanding and readability, I properly commented on the code, what exactly this snippet is going to do !

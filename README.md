# YouTubeSentiment

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.4.

## Getting Started

You will need to create a Firebase Account and then setup Firebase Authentication using Email/Password, Setup Firebase Firestore with these rules:


```bash
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to read and write their own reports
      match /reports/{reportId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Deny access to all other documents
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

You will also need to setup Firebase Remote Config with the following parameters:

```
Parameter Name: gemini_2_5_flash_key Value: Your Gemini AI Key (Create using Google AI Studio)
Parameter Name: youtube_api_key Value: Your API Key from Google Cloud Console

After you create your Firebase project, you can go to Google Cloud Console and activate the Youtube Data API v3 and then create API key credentials - this is where you will get your API Key from
```
Once you have Firebase setup, and have setup your Remote Config, open the project in your editor of choice (Webstorm, etc) and edit the environment files. You will need to copy your project SDK settings into the environment files.


## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

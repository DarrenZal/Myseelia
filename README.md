# Myseelia 

The app is built with:

-   [Webnative](https://github.com/webnative-examples/webnative-app-template)
    -   [SvelteKit](https://kit.svelte.dev/) (powered by [Vite](https://vitejs.dev/) under the hood)
    -   [TypeScript](https://www.typescriptlang.org/)
    -   [Tailwind](https://tailwindcss.com/)
    -   [DaisyUI](https://daisyui.com/)
-   [TerminusDB](https://terminusdb.com/)
-   [Cytoscape](https://js.cytoscape.org/)
-   [Meilisearch](https://www.meilisearch.com/)

## 🚀 Getting Started

You can try out the app yourself [here](https://thick-nylon-eagle.fission.app/).

Ready? Let's go.

Prerequiste: ensure you are running Node 16.14 or greater, but _not_ Node 17 (18 is fine though!).

1. Clone the repository:

    ```shell
    git clone git@github.com:DarrenZal/Myseelia.git
    ```

2. Install the dependencies.

    ```shell
    npm install
    ```

3. Start the local development server.

    ```shell
    npm run dev
    ```

4. Navigate to `http://localhost:5173` in your web browser.


## 🧨 Deploy

Any static hosting platform should be supported.

The Myseelia app is currently hosted on [Fission App Hosting](https://github.com/webnative-examples/webnative-app-template#fission-app-hosting)

## Fission App Hosting

A Webnative application can be published to IPFS with the [Fission CLI](https://guide.fission.codes/developers/cli) or the [Fission GitHub publish action](https://github.com/fission-suite/publish-action).

**To publish with the Fission CLI:**

1. [Install the CLI](https://guide.fission.codes/developers/installation)
2. Run `fission setup` to make a Fission account
3. Run `npm run build` to build the app
4. Delete `fission.yaml`
5. Run `fission app register` to register a new Fission app (accept the `./build` directory suggestion for your build directory)
6. Run `fission app publish` to publish your app to the web

Your app will be available online at the domain assigned by the register command.

**To set up the GitHub publish action:**

1. Register the app with the CLI
2. Export your machine key with `base64 ~/.config/fission/key/machine_id.ed25519`
3. Add your machine key as a GH Repository secret named `FISSION_MACHINE_KEY`
4. Update the `publish.yml` with the name of your registered app

See the [Fission Guide](https://guide.fission.codes/developers/installation) and the publish action README for more details.


### Static Build

Export a static build.

```shell
npm run build
```

The build outputs the static site to the `build` directory.

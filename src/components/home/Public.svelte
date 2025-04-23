<script lang="ts">
  import { appName } from '$lib/app-info'
</script>

<div
  class="min-h-[calc(100vh-96px)] flex flex-col items-start justify-center max-w-[700px] m-auto gap-6 pb-5 text-sm"
>
  <h1 class="text-xl">Welcome to {appName}</h1>
  <a class="btn btn-primary" href="/Chat">Try ReFi Chat</a>
  <div class="max-w-[590px]">
    <p class="mb-5">
      This app uses passwordless login based on keys generated in your browser. Click Register to create a new identity and encrypted filesystem.
      <br />
      <br />
      <a class="btn btn-primary btn-sm !h-10" href="/register">Register / Login</a>
    </p>
  </div>
</div>

<script lang="ts">
  import { sessionStore } from '../../stores'
</script>

<div
  class="min-h-[calc(100vh-128px)] md:min-h-[calc(100vh-160px)] pt-8 md:pt-16 flex flex-col items-start max-w-[690px] m-auto gap-10 pb-5 text-sm"
>
  <h1 class="text-xl">Welcome, {$sessionStore.username}!</h1>

  <div class="flex flex-col items-start justify-center gap-5">
    <h2 class="text-lg">ReFi Chat</h2>
    <p>
      ReFi Chat is a chatbot that answers questions about Regenerative Finance (ReFi).<br>
    </p>
    <a class="btn btn-primary" href="/Chat">Try ReFi Chat</a>
    <p>
      Learn about this app 
      <a class="link link-primary whitespace-nowrap" href="/about">here</a>
      <br>
    </p>
  </div>

  <div class="flex flex-col items-start justify-center gap-5">
    <h2 class="text-lg">Additional Device Connection</h2>
    <p>
      With Webnative SDK, a user’s account lives only on their connected devices
      — entirely under their control. It’s easy for them to connect as many
      devices as they’d like. For recoverability, we recommend they always
      connect at least two.
    </p>
    <a class="btn btn-primary" href="/delegate-account">
      Connect an additional device
    </a>
  </div>
</div>
<style>

  .blue-link {
  
  color: blue;
  
  text-decoration: underline;
  
  cursor: pointer;
  
  }
  
  </style>



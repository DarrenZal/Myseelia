<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { sessionStore } from '$src/stores'
  import About from '$components/icons/About.svelte'
  import BrandLogo from '$components/icons/BrandLogo.svelte'
  import BrandWordmark from '$components/icons/BrandWordmark.svelte'
  import Home from '$components/icons/Home.svelte'
  import PhotoGallery from '$components/icons/PhotoGallery.svelte'
  import Settings from '$components/icons/Settings.svelte'
  import InfoThinIcon from '$components/icons/InfoThinIcon.svelte'
  import Chat from '$components/icons/Chat.svelte'

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home
    },
    {
      label: 'Chat',
      href: '/Chat',
      icon: Chat
    },
    /* {
      label: 'Profile',
      href: '/gallery/',
      icon: PhotoGallery
    },
    {
      label: 'Network Map',
      href: '/explore/',
      icon: PhotoGallery
    },
    {
      label: 'Geo Map',
      href: '/geomap/',
      icon: PhotoGallery
    }, */
    // {
    //   label: 'CTA',
    //   href: '/cta/',
    //   icon: PhotoGallery
    // },
    {
      label: 'About This App',
      href: '/about/',
      icon: About
    },
    {
      label: 'Account Settings',
      href: '/settings/',
      icon: Settings
    }
  ]

  let checked = false
  const handleCloseDrawer = (): void => {
    checked = false
  }
</script>

<!-- Only render the nav if the user is authed and not in the connection flow -->
{#if $sessionStore.authed && !$page.url.pathname.match(/register|backup|delegate/)}
  <div class="drawer drawer-mobile h-screen">
    <input
      id="sidebar-nav"
      class="drawer-toggle"
      type="checkbox"
      bind:checked
    />
    <div class="drawer-content flex flex-col">
      <slot />
    </div>
    <div class="drawer-side">
      <label
        for="sidebar-nav"
        class="drawer-overlay !bg-[#262626] !opacity-[.85]"
      />
      <div class="menu p-4 overflow-y-auto w-80 bg-base-100 text-base-content">
        <!-- Brand -->
        <div
          class="flex items-center gap-3 cursor-pointer mb-8"
          on:click={() => {
            handleCloseDrawer()
            goto('/')
          }}
        >
          <BrandLogo />
          <BrandWordmark />
        </div>

        <!-- Menu -->
        <ul>
          {#each navItems as item}
            <li>
              <a
                class="flex items-center justify-start gap-2 font-bold text-sm text-base-content hover:text-base-100 bg-base-100 hover:bg-base-content ease-in-out duration-[250ms] {$page
                  .url.pathname === item.href
                  ? '!text-base-100 !bg-base-content'
                  : ''}"
                href={item.href}
                on:click={handleCloseDrawer}
              >
                <svelte:component this={item.icon} />{item.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
{:else}
  <slot />
{/if}

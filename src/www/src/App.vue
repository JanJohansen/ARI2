<template>
  <div class="mainDiv">
    <b-navbar class="ariNav" toggleable="md" type="dark" variant="dark">

      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>

      <b-navbar-brand href="#">ARI 2.0</b-navbar-brand>

      <b-collapse is-nav id="nav_collapse">

        <b-navbar-nav>
          <b-nav-item href="#">Link</b-nav-item>
          <b-nav-item href="#" disabled>Disabled</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">

          <b-nav-form>
            <b-form-input size="sm" class="mr-sm-2" type="text" placeholder="Search"/>
            <b-button size="sm" class="my-2 my-sm-0" type="submit">Search</b-button>
          </b-nav-form>

          <b-nav-item-dropdown text="User" right>
            <b-dropdown-item href="#">Logout</b-dropdown-item>
            <b-dropdown-item href="#">Settings</b-dropdown-item>
          </b-nav-item-dropdown>

        </b-navbar-nav>

      </b-collapse>
    </b-navbar>

    <router-view class="view"></router-view>

  </div>
</template>

<script>
export default {
  name: "app",
  data() {
    return {
    };
  },
  created() {
  }
};
</script>
<style>

.mainDiv{
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  font-family: "Arial";
}
.ariNav{
  flex: 0 1 auto;
}
.view {
  background-color: #DDDDDD;    
  flex: 1 1 auto;
}

</style>

<template>
  <div>
    <h1>Login:</h1>
    <form @submit.prevent="login">
      <label><input v-model="email" placeholder="email"></label>
      <br>
      <label><input v-model="pass" placeholder="password" type="password"></label>
      <br>
      <button type="submit">login</button>
    </form>
  </div>
</template>

<script>

class auth{
    static login(mail, password, cb){
        cb(true);
    }
}

export default {
  name: "login-page",
  data() {
    return {
      email: "",
      pass: ""
    };
  },
  components: {},
  created() {},
  methods: {
    login() {
      auth.login(this.email, this.pass, loggedIn => {
        if (!loggedIn) {
          this.error = true;
        } else {
          this.$router.replace(this.$route.query.redirect || "/");
        }
      });
    }
  }
};
</script>
<style>

</style>

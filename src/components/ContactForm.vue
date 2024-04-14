<template>
    <section>
      
      <div v-if="submitted" class="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3" role="alert">
        <p class="font-bold">Thank you!</p>
        <p class="text-sm">Thank you for your email, I will get back to you as soon as I can.</p>
      </div>

 
      <form v-else
        @submit.prevent="handleSubmit"
        name="contact-me"
        method="post"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
      >
        
            <label for="grid-first-name"
              >First Name</label
            >
            <input
              id="grid-first-name"
              type="text"
              placeholder="Jane"
              :rules="rules"
              v-model="firstName"
              name="firstName"
              required
            />
         
            <label for="grid-last-name"
              >Last Name</label
            >
            <input
              id="grid-last-name"
              type="text"
              placeholder="Doe"
              :rules="rules"
              v-model="lastName"
              name="lastName"
              required
            />
          
            <label for="grid-email"
              >Email</label
            >
            <input
             id="grid-password"
              type="email"
              placeholder="my@email.com"
              :rules="rules"
              v-model="email"
              name="email"
              required
            />
         
            <label for="grid-message"
              >Message</label
            >
            <textarea
              cols="50"
              rows="10"
              id="grid-message"
              type="text"
              placeholder="My message to you"
              :rules="rules"
              v-model="message"
              name="message"
              required
            ></textarea>

            <input type="hidden" name="form-name" value="contact-us" />
         
            <button
              type="submit"
              :disabled="!valid"
            >
              Submit
            </button>
         
      </form>
    </section>
  </template>
  
  <script>
  export default {
    name: "ContactLayout",
    data() {
      return {
        firstName: "",
        lastName: "",
        message: "",
        email: "",
        submitted: false,
        valid: true,
        rules: [
          (firstName) => !!firstName,
          (lastName) => !!lastName,
          (message) => !!message,
          (email) => !!email,
          (v) => !!v || "This field is required",
        ],
      };
    },
    methods: {
      encode(data) {
        return Object.keys(data)
          .map(
            (key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
          )
          .join("&");
      },
      handleSubmit() {
        fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: this.encode({
            "form-name": "contact-me",
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            message: this.message,
          }),
        })
          .then(() => {
            this.submitted = true;
          })
          .catch(() => {
            alert("Sorry, there seems to have been an error.");
          });
      },
    },
  };
  </script>
  
  <style>
  


  form {
    display: flex;
    flex-direction: column;
    margin-left: auto;
    margin-right: auto;
  }

  input, textarea {
    width: 100%;
    text-indent:1em;
    padding: 1em;
    margin-bottom: 1em;
    border: 2px solid #eee;
    border-radius: 4px;
  }


  
  
</style>
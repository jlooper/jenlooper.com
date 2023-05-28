<template>
    <section>
      
      <div v-if="submitted">
        <p>Thank you for your email, I will get back to you as soon as I can.</p>
      </div>
  
      <form
        @submit.prevent="handleSubmit"
        netlify
        name="contact-me"
        method="post"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
      >
        <div>
          <div>
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
          </div>
          <div>
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
          </div>
        </div>
        <div>
          <div>
            <label class="font-semibold mb-2 text-gray-600" for="grid-email"
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
          </div>
        </div>
        <div>
          <div>
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
          </div>
        </div>
  
        <div>
          <div >
            <button
              type="submit"
              :disabled="!valid"
              class="shadow font-sans bg-gray-600 hover:bg-gray-800 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
            >
              Submit
            </button>
          </div>
        </div>
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
    width: min(32rem, 100%);
    margin-left: auto;
    margin-right: auto;
  }

  input, textarea {
    width: 100%;
    text-indent:1em;
    padding: 1em;
    margin: 1em;
    border: 2px solid #eee;
    border-radius: 4px;
  }


  
  
</style>
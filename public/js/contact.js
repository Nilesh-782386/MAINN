document.getElementById("myForm").addEventListener("submit", function (event) {
  var name = document.getElementsByName("name")[0].value.trim();
  var email = document.getElementsByName("email")[0].value.trim();
  var message = document.getElementById("message").value.trim();

  if (name === "" || email === "" || message === "") {
    event.preventDefault(); // Prevent form submission
    alert("Please fill out all fields.");
  } else {
    alert("Query submitted successfully !!");
  }
});

function increase(id) {
  var numberInput = document.getElementById(id);
  numberInput.value = parseInt(numberInput.value) + 1;
}

function decrease(id) {
  var numberInput = document.getElementById(id);
  var currentValue = parseInt(numberInput.value);
  if (currentValue > 0) {
    numberInput.value = currentValue - 1;
  }
}

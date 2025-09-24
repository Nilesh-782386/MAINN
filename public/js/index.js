// slider

var slideIndex = 0;
showSlides();
function showSlides() {
  var i;
  var slides = document.getElementsByClassName("mySlides");
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slideIndex++;
  if (slideIndex > slides.length) {
    slideIndex = 1;
  }
  slides[slideIndex - 1].style.display = "block";
  setTimeout(showSlides, 3000);
}

// corporate partener scrollar

const scrollers = document.querySelectorAll(".scroller");

// If a user hasn't opted in for recuded motion, then we add the animation
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  addAnimation();
}

function addAnimation() {
  scrollers.forEach((scroller) => {
    // add data-animated="true" to every `.scroller` on the page
    scroller.setAttribute("data-animated", true);

    // Make an array from the elements within `.scroller-inner`
    const scrollerInner = scroller.querySelector(".scroller__inner");
    const scrollerContent = Array.from(scrollerInner.children);

    // For each item in the array, clone it
    // add aria-hidden to it
    // add it into the `.scroller-inner`
    scrollerContent.forEach((item) => {
      const duplicatedItem = item.cloneNode(true);
      duplicatedItem.setAttribute("aria-hidden", true);
      scrollerInner.appendChild(duplicatedItem);
    });
  });
}

// no of volunters and Ngo's

function startCountingWhenVisible() {
  let valueDisplays = document.querySelectorAll(".num");
  let interval = 4000;

  // Options for the IntersectionObserver
  let options = {
    root: null,
    rootMargin: "0px",
    threshold: 0.5, // When 50% of the element is visible
  };

  // IntersectionObserver callback function
  let observerCallback = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        let valueDisplay = entry.target;
        let startValue = 0;
        let endValue = parseInt(valueDisplay.getAttribute("data-val"));
        let duration = Math.floor(interval / endValue);
        let counter = setInterval(function () {
          startValue += 1;
          valueDisplay.textContent = startValue;
          if (startValue == endValue) {
            clearInterval(counter);
          }
        }, duration);

        // Stop observing once counting starts
        observer.unobserve(valueDisplay);
      }
    });
  };

  // Create IntersectionObserver
  let observer = new IntersectionObserver(observerCallback, options);

  // Observe each value display element
  valueDisplays.forEach((valueDisplay) => {
    observer.observe(valueDisplay);
  });
}

// Call the function when the document is loaded
document.addEventListener("DOMContentLoaded", startCountingWhenVisible);

document
  .getElementById("donateButton")
  .addEventListener("click", function (event) {
    alert("you Don't have please Login First !!");
  });

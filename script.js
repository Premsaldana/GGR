document.addEventListener("DOMContentLoaded", () => {
    let currentSlide = 0;
    const slides = document.querySelectorAll(".slide");
    const totalSlides = slides.length;
    const prevButton = document.querySelector(".prev");
    const nextButton = document.querySelector(".next");
    let slideInterval;

    // Function to show the current slide
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove("active");
            const video = slide.querySelector("video");
            const playPauseButton = slide.querySelector(".play-pause-btn");
            if (i === index) {
                slide.classList.add("active");
                if (video) {
                    video.pause(); // Make sure other videos are paused
                    video.currentTime = 0; // Reset the video
                    playPauseButton.textContent = "Play"; // Reset the button text to "Play"
                }
            } else {
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
            }

            // Toggle play/pause button for current slide
            if (video && playPauseButton) {
                playPauseButton.addEventListener("click", () => {
                    if (video.paused) {
                        video.play();
                        playPauseButton.textContent = "Pause"; // Change button to "Pause"
                    } else {
                        video.pause();
                        playPauseButton.textContent = "Play"; // Change button to "Play"
                    }
                });
            }
        });
    }

    // Function to change slide based on direction
    function changeSlide(direction) {
        currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
        showSlide(currentSlide);
    }

    // Function to auto-change slides every 5 seconds
    function startAutoSlide() {
        slideInterval = setInterval(() => changeSlide(1), 3000);
    }

    // Function to reset interval when user interacts
    function resetInterval() {
        clearInterval(slideInterval);
        startAutoSlide();
    }

    // Event listeners for arrow key navigation
    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            changeSlide(-1);
            resetInterval();
        } else if (event.key === "ArrowRight") {
            changeSlide(1);
            resetInterval();
        }
    });

    // Event listeners for on-screen buttons
    prevButton.addEventListener("click", () => {
        changeSlide(-1);
        resetInterval();
    });

    nextButton.addEventListener("click", () => {
        changeSlide(1);
        resetInterval();
    });

    // Initialize first slide and start auto-sliding
    showSlide(currentSlide);
    startAutoSlide();
});





document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.createElement("button");
    menuToggle.classList.add("menu-toggle");
    menuToggle.innerHTML = "☰"; // Hamburger icon
    document.querySelector("header").appendChild(menuToggle);

    const navMenu = document.querySelector("nav ul");
    
    menuToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
    });
});


function playVideo() {
    document.querySelector('.thumbnail').style.display = 'none';
    document.querySelector('.play-button').style.display = 'none';
    const video = document.getElementById('villaVideo');
    video.style.display = 'block';
    video.play();
}
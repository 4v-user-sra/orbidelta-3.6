document.addEventListener("DOMContentLoaded", () => {
    const counters = document.querySelectorAll(".counter");
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseFloat(counter.getAttribute("data-target"));
                const isFloat = counter.classList.contains("float-counter");
                const duration = 2000; // ms
                const incrementTime = 30; // ms
                const steps = duration / incrementTime;
                const increment = target / steps;
                
                let current = 0;
                
                const updateCounter = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        counter.innerText = isFloat ? target.toFixed(1) : Math.round(target);
                        clearInterval(updateCounter);
                    } else {
                        counter.innerText = isFloat ? current.toFixed(1) : Math.round(current);
                    }
                }, incrementTime);
                
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
});

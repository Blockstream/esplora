import { Observable as O } from '../rxjs';

const staticRoot = process.env.STATIC_ROOT || '';

let loaded = false;
function load() {
  if (loaded) return Promise.resolve();
  
  const scriptPath = `${staticRoot}js/infinite-scroll.js`;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptPath;
    script.async = true;
    
    script.onload = () => {
      loaded = true;
      resolve();
    };
    script.onerror = (error) => {
      console.error('Failed to load script:', error);
      reject(error);
    };
    
    document.body.appendChild(script);
  });
}

const makeInfiniteScrollDriver = () => {
  
  if (typeof window === 'undefined') {
    return () => O.empty();
  }

  return (mode$) => {
    
    return O.from(mode$).switchMap(active => {
      if (!active || !process.browser) return O.empty();
      
      return O.from(load()).flatMap(() => {
        if (typeof window.initInfiniteScroll === 'function') {
          window.initInfiniteScroll();
        } else {
          return O.interval(200).take(10).filter(() => typeof window.initInfiniteScroll === 'function').do(() => {
            window.initInfiniteScroll();
          });
        }
        return O.empty();
      });
    });
  };
};

module.exports = makeInfiniteScrollDriver;
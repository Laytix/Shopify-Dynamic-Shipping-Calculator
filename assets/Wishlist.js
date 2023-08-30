const LOCAL_STORAGE_WISHLIST_KEY = 'shopify-wishlist';
const LOCAL_STORAGE_DELIMITER = ',';
const BUTTON_ACTIVE_CLASS = 'active';
const GRID_LOADED_CLASS = 'loaded';

const selectors = {
  button: '[button-wishlist]',
  grid: '[grid-wishlist]',
  productCard: '.product-card',
};

document.addEventListener('DOMContentLoaded', () => {
  initButtons();
  initGrid();
});

document.addEventListener('shopify-wishlist:updated', (event) => {
  console.log('[Shopify Wishlist] Wishlist Updated ✅', event.detail.wishlist);
  initGrid();
});

document.addEventListener('shopify-wishlist:init-product-grid', (event) => {
  console.log('[Shopify Wishlist] Wishlist Product List Loaded ✅', event.detail.wishlist);
});

document.addEventListener('shopify-wishlist:init-buttons', (event) => {
  console.log('[Shopify Wishlist] Wishlist Buttons Loaded ✅', event.detail.wishlist);
});

const fetchProductCardHTML = (handle) => {
  const productTileTemplateUrl = `/products/${handle}?view=card`;
  return fetch(productTileTemplateUrl)
  .then((res) => res.text())
  .then((res) => {
    const text = res;
    const parser = new DOMParser();
    const htmlDocument = parser.parseFromString(text, 'text/html');
    console.log(htmlDocument)
    const productCard = htmlDocument.documentElement.querySelector(".card-wrapper");
    console.log(productCard)
    return productCard.outerHTML;
  })
  .catch((err) => console.error(`[Shopify Wishlist] Failed to load content for handle: ${handle}`, err));
};

fetchProductCardsFromCollection = (arrOfHandles) =>{
  return fetch("https://appless-wishlist-demo-store.myshopify.com/collections/all")
  .then((res) => res.text())
  .then((res) => {
    const text = res;
    const parser = new DOMParser();
    const htmlDocument = parser.parseFromString(text, 'text/html');
    const allProductCards = htmlDocument.documentElement.querySelectorAll("li.grid__item")
    const cardsInWishlist = Array.from(allProductCards).filter(card => {
      const handle = card.querySelector(".wishlist-btn").getAttribute("data-product-handle")
      if(arrOfHandles.indexOf(handle) !== -1){ //means that it exists in array of handles
        return card
      }
    })
  })
  .catch((err) => console.error(`[Shopify Wishlist] Failed to load content for handle:`, err));
}

const setupGrid = async (grid) => {
  const wishlist = getWishlist();
  // fetchProductCardsFromCollection(wishlist)
  // const requests = wishlist.map(fetchProductCardHTML);
  // const responses = await Promise.all(requests);
  // const wishlistProductCards = responses.join('');
  // grid.innerHTML = wishlistProductCards;
  grid.classList.add(GRID_LOADED_CLASS);
  initButtons();

  const event = new CustomEvent('shopify-wishlist:init-product-grid', {
    detail: { wishlist: wishlist }
  });
  document.dispatchEvent(event);
};

const setupButtons = (buttons) => {
  buttons.forEach((button) => {
    const productHandle = button.dataset.productHandle || false;
    if (!productHandle) return console.error('[Shopify Wishlist] Missing `data-product-handle` attribute. Failed to update the wishlist.');
    if (wishlistContains(productHandle)) button.classList.add(BUTTON_ACTIVE_CLASS);
    button.addEventListener('click', () => {
      updateWishlist(productHandle);
      button.classList.toggle(BUTTON_ACTIVE_CLASS);
    });
  });
};

const initGrid = () => {
  const grid = document.querySelector(selectors.grid) || false;
  if (grid) setupGrid(grid);
};

const initButtons = () => {
  const buttons = document.querySelectorAll(selectors.button) || [];
  if (buttons.length) setupButtons(buttons);
  else return;
  const event = new CustomEvent('shopify-wishlist:init-buttons', {
    detail: { wishlist: getWishlist() }
  });
  document.dispatchEvent(event);
};

const getWishlist = () => {
  const wishlist = localStorage.getItem(LOCAL_STORAGE_WISHLIST_KEY) || false;
  if (wishlist) return wishlist.split(LOCAL_STORAGE_DELIMITER);
  return [];
};

const setWishlist = (array, handle) => {
  const wishlist = array.join(LOCAL_STORAGE_DELIMITER);
  if (array.length) localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, wishlist);
  else localStorage.removeItem(LOCAL_STORAGE_WISHLIST_KEY);

  const event = new CustomEvent('shopify-wishlist:updated', {
    detail: { wishlist: array }
  });
  document.dispatchEvent(event);

  const heart = Array.from(document.querySelectorAll("li.grid__item")).find(elem => {
    const btn = elem.querySelector(".wishlist-btn")
    if(btn.dataset.productHandle === handle){
      return elem
    }
  })

  heart.querySelector(".icon").classList.toggle("active")
  return wishlist;
};

const updateWishlist = (handle) => {
  const wishlist = getWishlist();
  const indexInWishlist = wishlist.indexOf(handle);
  if (indexInWishlist === -1) wishlist.push(handle);
  else wishlist.splice(indexInWishlist, 1);
  return setWishlist(wishlist, handle);
};

const wishlistContains = (handle) => {
  const wishlist = getWishlist();
  return wishlist.includes(handle);
};

const resetWishlist = () => {
  return setWishlist([]);
};

const removeFromWishlist = (handleToRemove, eventObj) => {
  const currentList = localStorage.getItem("shopify-wishlist").split(",")
  const newList = currentList.filter(handle => handle !== handleToRemove).join()
  localStorage.setItem("shopify-wishlist",newList)
  console.log('[Shopify Wishlist] Wishlist Updated ✅')
  eventObj.target.parentElement.parentElement.parentElement.parentElement.parentElement.remove()

  if(!localStorage.getItem("shopify-wishlist")){
    document.querySelector("#no-list-cta").style.display = "flex"
    document.querySelector("#no-list-cta").style.alignItems = "center"
    document.querySelector("#no-list-cta").style.justifyContent = "center"
  }
}

const setActiveHearts = () => {
  const currentList = localStorage.getItem("shopify-wishlist").split(",")
  const hearts = Array.from(document.querySelectorAll("li.grid__item .wishlist-btn"))

  const handleObj = {}
  currentList.forEach(handle => {
    if(!handleObj[handle]){
      handleObj[handle] = true
    }
  })

  hearts.forEach(heart => {
    console.log(heart)
    if(handleObj[heart.dataset.productHandle]){
      heart.querySelector(".icon").classList.add("active")
    }
  })
}

setTimeout(() => {
  setActiveHearts()
}, 1000);
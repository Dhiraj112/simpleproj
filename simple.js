// Sample laptop data for Nepal market
const laptopData = [
    {
        id: 1,
        name: "Dell XPS 13",
        brand: "Dell",
        price: 175000,
        image: "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-13-9310/media-gallery/xs9310t-cnb-00055lf110-sl.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=402&qlt=100,1&resMode=sharp2&size=402,402",
        specs: {
            processor: "Intel Core i7-1165G7",
            ram: "16GB",
            storage: "512GB SSD",
            display: "13.4-inch FHD+"
        },
        availability: true
    },
    {
        id: 2,
        name: "MacBook Air M2",
        brand: "Apple",
        price: 210000,
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=452&hei=420&fmt=jpeg&qlt=95&.v=1653084303665",
        specs: {
            processor: "Apple M2 Chip",
            ram: "8GB",
            storage: "256GB SSD",
            display: "13.6-inch Liquid Retina"
        },
        availability: true
    },
    {
        id: 3,
        name: "HP Pavilion 15",
        brand: "HP",
        price: 95000,
        image: "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06720765.png",
        specs: {
            processor: "AMD Ryzen 5 5500U",
            ram: "8GB",
            storage: "512GB SSD",
            display: "15.6-inch FHD"
        },
        availability: true
    },
    {
        id: 4,
        name: "Lenovo ThinkPad X1 Carbon",
        brand: "Lenovo",
        price: 185000,
        image: "https://p2-ofp.static.pub/fes/cms/2021/12/09/dx2jlwntf68l7th4rxk65tk0d6p79t887032.png",
        specs: {
            processor: "Intel Core i7-1165G7",
            ram: "16GB",
            storage: "1TB SSD",
            display: "14-inch 4K"
        },
        availability: false
    },
    {
        id: 5,
        name: "Acer Swift 3",
        brand: "Acer",
        price: 85000,
        image: "https://static.acer.com/up/Resource/Acer/Laptops/Swift_3/Images/20200420/Acer-Swift-3_SF314-57_FP-Backlit_Silver_modelmain.png",
        specs: {
            processor: "Intel Core i5-1135G7",
            ram: "8GB",
            storage: "512GB SSD",
            display: "14-inch FHD"
        },
        availability: true
    },
    {
        id: 6,
        name: "Asus ROG Strix G15",
        brand: "Asus",
        price: 165000,
        image: "https://dlcdnwebimgs.asus.com/gain/F99B1D96-858F-4425-93E4-FEDB7D8BE92F",
        specs: {
            processor: "AMD Ryzen 7 6800H",
            ram: "16GB",
            storage: "1TB SSD",
            display: "15.6-inch FHD 144Hz"
        },
        availability: true
    },
    {
        id: 7,
        name: "MSI GF63 Thin",
        brand: "MSI",
        price: 110000,
        image: "https://storage-asset.msi.com/global/picture/image/feature/nb/GF/GF63-Thin-9S/gs63-9th-1.png",
        specs: {
            processor: "Intel Core i5-11400H",
            ram: "8GB",
            storage: "512GB SSD",
            display: "15.6-inch FHD"
        },
        availability: true
    },
    {
        id: 8,
        name: "Microsoft Surface Laptop 4",
        brand: "Microsoft",
        price: 160000,
        image: "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4LVtJ?ver=3b61",
        specs: {
            processor: "AMD Ryzen 5 4680U",
            ram: "8GB",
            storage: "256GB SSD",
            display: "13.5-inch PixelSense"
        },
        availability: false
    }
];

// DOM elements
const laptopContainer = document.getElementById('laptopContainer');
const searchInput = document.getElementById('searchInput');
const filterBrand = document.getElementById('filterBrand');
const sortBy = document.getElementById('sortBy');

// Populate brand filter dropdown
function populateBrandFilter() {
    const brands = [...new Set(laptopData.map(laptop => laptop.brand))];
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        filterBrand.appendChild(option);
    });
}

// Format price in Nepali Rupees
function formatPrice(price) {
    return 'NPR ' + price.toLocaleString('en-US');
}

// Create laptop card element
function createLaptopCard(laptop) {
    const card = document.createElement('div');
    card.className = 'laptop-card';
    
    // Add availability class if not available
    if (!laptop.availability) {
        card.classList.add('out-of-stock');
    }
    
    card.innerHTML = `
        <img src="${laptop.image}" alt="${laptop.name}" class="laptop-image">
        <div class="laptop-info">
            <span class="laptop-brand">${laptop.brand}</span>
            <h3 class="laptop-name">${laptop.name}</h3>
            <p class="laptop-price">${formatPrice(laptop.price)}</p>
            <p class="laptop-specs"><strong>Processor:</strong> ${laptop.specs.processor}</p>
            <p class="laptop-specs"><strong>RAM:</strong> ${laptop.specs.ram}</p>
            <p class="laptop-specs"><strong>Storage:</strong> ${laptop.specs.storage}</p>
            <p class="laptop-specs"><strong>Display:</strong> ${laptop.specs.display}</p>
            <p class="laptop-specs"><strong>Availability:</strong> ${laptop.availability ? 'In Stock' : 'Out of Stock'}</p>
        </div>
    `;
    
    return card;
}

// Display laptops based on filters and sorting
function displayLaptops() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedBrand = filterBrand.value;
    const sortOption = sortBy.value;
    
    // Clear previous content
    laptopContainer.innerHTML = '';
    
    // Filter laptops
    let filteredLaptops = laptopData.filter(laptop => {
        const matchesSearch = laptop.name.toLowerCase().includes(searchTerm) || 
                             laptop.brand.toLowerCase().includes(searchTerm) ||
                             laptop.specs.processor.toLowerCase().includes(searchTerm);
        
        const matchesBrand = selectedBrand === '' || laptop.brand === selectedBrand;
        
        return matchesSearch && matchesBrand;
    });
    
    // Sort laptops
    filteredLaptops.sort((a, b) => {
        if (sortOption === 'price-asc') {
            return a.price - b.price;
        } else if (sortOption === 'price-desc') {
            return b.price - a.price;
        } else if (sortOption === 'name') {
            return a.name.localeCompare(b.name);
        }
        return 0;
    });
    
    // Display message if no results
    if (filteredLaptops.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'loading';
        noResults.textContent = 'No laptops found matching your criteria.';
        laptopContainer.appendChild(noResults);
        return;
    }
    
    // Add laptop cards to container
    filteredLaptops.forEach(laptop => {
        laptopContainer.appendChild(createLaptopCard(laptop));
    });
}

// Event listeners
searchInput.addEventListener('input', displayLaptops);
filterBrand.addEventListener('change', displayLaptops);
sortBy.addEventListener('change', displayLaptops);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    populateBrandFilter();
    displayLaptops();
});

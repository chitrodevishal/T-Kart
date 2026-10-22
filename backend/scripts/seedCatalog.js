import 'dotenv/config';
import { configureDnsServers } from '../config/dns.js';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import productImageService from '../services/productImageService.js';
import { isValidExternalImageUrl } from '../utils/imageUrl.js';

const catalog = [
  {
    name: 'Home & Living',
    description: 'Thoughtful essentials for comfortable everyday living.',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
    products: [
      {
        name: 'Ceramic Table Lamp', sku: 'TK-DEMO-LAMP-001', description: 'A warm, minimal ceramic lamp for a bedside table or reading nook.',
        price: 2499, discount: 10, stock: 24,
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Woven Cotton Throw', sku: 'TK-DEMO-THROW-001', description: 'A soft, breathable cotton throw for the sofa or bedroom.',
        price: 1899, discount: 0, stock: 32,
        image: 'https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    name: 'Kitchen & Dining',
    description: 'Useful, well-made pieces for cooking and sharing meals.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    products: [
      {
        name: 'Pour-Over Coffee Set', sku: 'TK-DEMO-COFFEE-001', description: 'A ceramic dripper and matching server for a simple pour-over ritual.',
        price: 1599, discount: 10, stock: 18,
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Insulated Steel Bottle', sku: 'TK-DEMO-BOTTLE-001', description: 'A reusable double-wall bottle that keeps drinks at the right temperature.',
        price: 999, discount: 0, stock: 40,
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    name: 'Accessories',
    description: 'Everyday accessories selected for practical design and lasting use.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
    products: [
      {
        name: 'Everyday Canvas Tote', sku: 'TK-DEMO-TOTE-001', description: 'A sturdy canvas carryall for errands, work, and weekends.',
        price: 799, discount: 0, stock: 50,
        image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Classic Analog Watch', sku: 'TK-DEMO-WATCH-001', description: 'A clean analog watch with a versatile strap for daily wear.',
        price: 3499, discount: 20, stock: 12,
        image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    name: 'Audio & Tech',
    description: 'Simple tech and audio gear for work, travel, and downtime.',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80',
    products: [
      {
        name: 'Wireless Bluetooth Headphones', sku: 'TK-DEMO-HEADPHONES-001', description: 'Comfortable wireless headphones with clear sound for everyday listening.',
        price: 4999, discount: 10, stock: 20,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Compact Bluetooth Speaker', sku: 'TK-DEMO-SPEAKER-001', description: 'A portable speaker with room-filling sound in a compact design.',
        price: 2999, discount: 0, stock: 16,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
];

const additionalProductNames = {
  'Home & Living': [
    'Ribbed Glass Vase', 'Linen Cushion Cover', 'Oak Picture Frame', 'Stoneware Planter', 'Cotton Bath Towel Set',
    'Minimal Wall Clock', 'Woven Storage Basket', 'Scented Soy Candle', 'Linen Table Runner', 'Soft Knit Cushion',
    'Wooden Serving Tray', 'Ceramic Soap Dispenser', 'Textured Floor Cushion', 'Reed Diffuser Set', 'Decorative Bookends',
    'Natural Jute Rug', 'Cotton Laundry Hamper', 'Marble Trinket Dish', 'Bamboo Desk Organizer', 'Pleated Fabric Lampshade',
    'Handwoven Coaster Set', 'Minimalist Door Mat', 'Ceramic Bud Vase', 'Soft Eyelet Curtain Pair', 'Wooden Jewelry Stand',
  ],
  'Kitchen & Dining': [
    'Acacia Chopping Board', 'Stoneware Dinner Plate Set', 'Double Wall Tea Glasses', 'Cotton Kitchen Towel Set', 'Glass Food Storage Set',
    'Stainless Steel Lunch Box', 'Ceramic Serving Bowl', 'Bamboo Cooking Utensils', 'Linen Dinner Napkins', 'Manual Coffee Grinder',
    'Glass Water Carafe', 'Enamel Milk Pan', 'Wooden Salad Servers', 'Stackable Spice Jars', 'Insulated Travel Mug',
    'Canvas Market Apron', 'Cast Iron Serving Pan', 'Porcelain Tea Pot', 'Reusable Produce Bags', 'Oil Pourer Bottle',
    'Stoneware Ramekin Set', 'Bamboo Cutlery Set', 'Lidded Sugar Bowl', 'Stainless Steel Whisk', 'Cotton Bread Basket',
  ],
  Accessories: [
    'Leather Card Holder', 'Minimal Crossbody Bag', 'Polarized Everyday Sunglasses', 'Woven Leather Belt', 'Travel Organizer Pouch',
    'Compact Zip Wallet', 'Classic Cotton Cap', 'Soft Knit Beanie', 'Slim Laptop Sleeve', 'Everyday Leather Keyring',
    'Packable Weekend Tote', 'Minimal Hoop Earrings', 'Textured Silk Scarf', 'Travel Passport Wallet', 'Canvas Utility Pouch',
    'Classic Leather Watch Strap', 'Foldable Umbrella', 'Stainless Steel Pendant', 'Reusable Shopping Bag', 'Everyday Crew Socks Set',
    'Compact Travel Jewelry Case', 'Minimal Barrette Set', 'Lightweight Weekend Backpack', 'Woven Bucket Hat', 'Soft Leather Coin Purse',
  ],
  'Audio & Tech': [
    'USB-C Fast Charging Cable', 'Compact Wireless Charger', 'Portable Power Bank', 'USB-C Wall Adapter', 'Foldable Laptop Stand',
    'Wireless Earbud Case', 'Bluetooth Keyboard', 'Wireless Optical Mouse', 'USB-C Hub Adapter', 'Adjustable Phone Stand',
    'Noise Isolating Earphones', 'Compact USB Desk Light', 'Smart Home Plug', 'HD Webcam Cover Set', 'Bluetooth Tracker Tag',
    'Braided Charging Cable Set', 'Travel Cable Organizer', 'Clip-On Reading Light', 'Compact Power Strip', 'Tablet Sleeve Case',
    'Portable SSD Case', 'Wireless Presenter Remote', 'USB-C Memory Drive', 'Ergonomic Mouse Pad', 'Bluetooth Audio Receiver',
  ],
};

const additionalProductDescriptions = {
  'Home & Living': [
    'Ribbed glass catches the light across its rounded profile; the narrow neck is sized for a single stem or a few fresh branches.',
    'A softly textured linen cover brings a relaxed finish to a standard cushion and has a discreet zip for easy removal.',
    'Display a favourite photograph in a smooth oak frame with a clear front panel and an easel stand for shelves or desks.',
    'Give a small indoor plant a warm home in this stoneware planter, finished with a drainage hole and a matching saucer.',
    'Two absorbent cotton towels with a looped weave make a comfortable, quick-drying pair for everyday bathroom use.',
    'Keep time at a glance with a quiet sweep movement, clear markers and a slim frame that sits neatly on the wall.',
    'This flexible woven basket tidies throws, toys or laundry while its built-in handles make it easy to carry between rooms.',
    'A clean-burning soy wax candle with a gentle botanical scent creates a calm glow for a slow evening at home.',
    'A lightweight linen runner adds natural texture to the centre of a dining table and is easy to fold away after meals.',
    'A breathable knit cushion adds a tactile layer to a reading chair, with a removable cover for straightforward care.',
    'Serve tea or snacks on a smooth acacia tray with raised edges that help keep cups and small dishes in place.',
    'A refillable ceramic dispenser keeps hand soap close to the sink and uses a pump designed for a measured press.',
    'Extra padding and a durable woven cover make this floor cushion a comfortable flexible seat for casual gatherings.',
    'A set of natural reeds disperses a fresh, understated fragrance without a flame or electrical diffuser.',
    'Use the sculpted pair to keep books upright on a shelf; their weighted bases help prevent a row from tipping over.',
    'A tightly woven jute rug adds natural texture underfoot in an entryway or beside a bed; the low pile is easy to maintain.',
    'A breathable cotton hamper gathers worn clothes between wash days and folds flat when it is not in use.',
    'Keep rings and small keepsakes together in a cool marble dish with a smooth surface and softly rounded edge.',
    'The bamboo organizer groups pens, notes and small desk accessories into easy-to-reach compartments.',
    'A pleated fabric shade softens direct bulb light and fits a standard lamp holder for an easy room refresh.',
    'Six hand-finished woven coasters protect tabletops from cups while adding a natural fibre accent to a coffee table.',
    'A dense, easy-clean surface helps catch everyday dust at the doorway, with a non-slip backing for steady placement.',
    'A compact ceramic bud vase gives a single flower or clipping a simple place on a bedside table or narrow shelf.',
    'Filter daylight while adding a little privacy with two airy eyelet curtains that slide onto a standard curtain pole.',
    'Keep necklaces and bracelets visible and tangle-free on a freestanding wooden stand with a stable base.',
  ],
  'Kitchen & Dining': [
    'A sturdy acacia board gives you a stable surface for chopping and turns into a simple serving board when guests arrive.',
    'Four glazed stoneware plates bring a coordinated look to everyday meals and are sized for main-course portions.',
    'Double-wall glass helps keep tea warm while the outside stays comfortable to hold; the clear design suits hot or cold drinks.',
    'A pair of absorbent cotton towels handles dish drying and small spills, with hanging loops for easy storage.',
    'Clear glass containers make pantry staples easy to see and include fitted lids to keep dry ingredients covered.',
    'A leak-resistant stainless lunch box packs a full meal for work or travel and cleans easily after use.',
    'A deep stoneware bowl is useful for serving salad, fruit or shared sides, with a glazed finish that wipes clean.',
    'Three smooth bamboo utensils cover everyday stirring, turning and serving while being gentle on non-stick cookware.',
    'Four washable linen napkins add a soft woven finish to place settings and fold neatly for weekday or dinner-party use.',
    'Adjust the grind to suit espresso or filter coffee with a compact hand grinder that stores neatly beside the brewer.',
    'A clear carafe keeps water within reach at the table and has a shaped spout for controlled, drip-free pouring.',
    'The enamel-coated steel body heats milk and small portions evenly, while the pouring lip helps serve without spills.',
    'A matched pair of acacia servers lifts and tosses salad without bruising tender leaves.',
    'Six clear jars with fitted lids keep spices visible, grouped and protected from kitchen splashes.',
    'A vacuum-insulated travel mug helps keep a drink hot on the commute and has a secure lid for carrying in a bag.',
    'A durable canvas apron protects clothing while cooking and has a front pocket for a timer or tasting spoon.',
    'A heavy cast-iron pan retains heat for serving sizzling sides straight from the oven to the table.',
    'A glazed porcelain teapot pours smoothly and includes a removable infuser for loose-leaf tea.',
    'Five washable mesh bags separate produce at the market and replace single-use produce bags for regular shopping.',
    'A narrow stainless spout gives measured control when dressing salads or finishing a pan with cooking oil.',
    'Four small stoneware ramekins portion sauces, dips and baked desserts, with a glaze that cleans easily.',
    'A compact bamboo set keeps reusable fork, spoon and chopsticks together for lunches away from home.',
    'A lidded ceramic bowl keeps sugar dry and includes a small notch for a serving spoon.',
    'A balanced stainless whisk blends sauces and batters while its narrow shape reaches into smaller mixing bowls.',
    'A breathable cotton basket keeps bread warm at the table and folds flat for storage between meals.',
  ],
  Accessories: [
    'A slim leather card holder keeps the daily essentials together with several quick-access card slots and a central pocket.',
    'Carry a phone, wallet and keys hands-free in a compact crossbody with an adjustable strap and secure top closure.',
    'Polarized lenses reduce glare on bright days, while the lightweight frame is shaped for comfortable everyday wear.',
    'A smooth woven leather belt adds a clean finishing detail and adjusts to fit through standard trouser loops.',
    'Separate chargers, cables and small travel items in a zip pouch that opens wide for quick packing and unpacking.',
    'A compact zip wallet keeps folded notes and cards secure without taking up much room in a pocket or small bag.',
    'A breathable cotton cap offers simple sun coverage with an adjustable back strap for a comfortable fit.',
    'A soft rib-knit beanie provides a warm layer for cooler days and folds easily into a coat pocket.',
    'A padded sleeve protects a laptop from light knocks and surface scratches while sliding easily into a work bag.',
    'Keep keys together on a durable leather loop with a sturdy metal ring that clips onto a bag or belt loop.',
    'A roomy packable tote carries market finds and folds into its own small pouch when not needed.',
    'Lightweight polished hoops bring a simple accent to everyday outfits and close with a secure hinged clasp.',
    'A soft silk scarf adds a light layer of colour and can be worn at the neck, in the hair or tied to a bag.',
    'Keep travel documents together in a slim passport wallet with separate slots for cards and boarding passes.',
    'A sturdy canvas pouch keeps small tools, cosmetics or charging accessories together inside a larger bag.',
    'Refresh the look of a compatible watch with a smooth leather strap and a standard adjustable buckle.',
    'A compact folding frame opens with one hand and provides dependable rain cover without weighing down a day bag.',
    'A simple stainless pendant hangs from a fine chain and layers easily with other everyday jewellery.',
    'Keep reusable bags close at hand in a small holder that clips onto a keyring or sits inside a handbag.',
    'A soft cotton blend and reinforced heel make this three-pair set comfortable for regular daily wear.',
    'A lined travel case separates rings and earrings in a compact shape that fits neatly in hand luggage.',
    'Three smooth-finish barrettes secure loose sections of hair without pulling or snagging.',
    'A padded back panel and adjustable shoulder straps make this lightweight backpack comfortable for short trips.',
    'A flexible brim and breathable woven finish make this bucket hat an easy packable option for sunny outings.',
    'A soft leather coin purse keeps loose change and small essentials zipped safely in a pocket or tote.',
  ],
  'Audio & Tech': [
    'A flexible USB-C cable supports everyday charging and data transfer, with reinforced connectors for regular plugging in.',
    'Set a compatible phone down to charge without a cable, using a low-profile wireless pad with a non-slip top.',
    'A portable high-capacity power bank adds charging on the move and includes clear indicators for its remaining charge.',
    'A compact USB-C adapter provides a dependable power connection for compatible phones, tablets and laptops.',
    'Raise a laptop to a more comfortable viewing height with a foldable stand that packs flat for travel.',
    'A protective silicone case helps prevent everyday scuffs on compatible wireless earbuds and keeps the case easy to spot.',
    'A compact Bluetooth keyboard connects wirelessly to compatible devices and gives a familiar layout for desk or travel use.',
    'A responsive wireless mouse offers adjustable tracking and a contoured shape for comfortable everyday navigation.',
    'Add useful ports to a USB-C laptop with a compact hub for connecting displays, storage and common accessories.',
    'A weighted adjustable phone stand keeps a screen upright for video calls, recipes or hands-free viewing.',
    'Soft in-ear tips help reduce background noise while the inline controls keep calls and playback easy to manage.',
    'A compact USB desk light directs a warm beam onto a workspace and adjusts to suit late-night reading or focused tasks.',
    'Switch a compatible appliance on or off remotely with a compact smart plug that fits neatly into a standard wall socket.',
    'A small sliding cover blocks the webcam when it is not in use and opens quickly for video calls.',
    'Attach the tracker to keys or a bag and use a compatible phone app to help locate misplaced everyday essentials.',
    'Three braided cables provide durable charging connections in common lengths for a desk, bedside table or travel kit.',
    'Separate charging leads and adapters in a divided zip case that keeps a travel kit tidy and easy to find.',
    'A flexible clip holds a focused light beside a book or e-reader without taking up space on the bedside table.',
    'A compact power strip adds several outlets and includes spaced sockets for bulkier plugs at a desk or media shelf.',
    'A padded tablet sleeve helps protect a compatible device from scratches while carrying it between home and work.',
    'A protective hard-shell case keeps a portable SSD safe from scuffs when stored with cables in a work bag.',
    'Advance presentation slides from across the room with a pocket-sized wireless remote and simple tactile controls.',
    'A small USB-C flash drive gives compatible devices a convenient way to move documents and media files.',
    'A smooth padded surface supports the wrist during extended mouse use and grips the desk to stay in place.',
    'Connect a wired audio source to compatible wireless headphones or speakers with a pocket-sized Bluetooth receiver.',
  ],
};

const expandedCatalog = catalog.map((entry, categoryIndex) => {
  const categoryCode = entry.name.toUpperCase().replace(/[^A-Z0-9]+/g, '');
  const additions = additionalProductNames[entry.name].map((name, index) => {
    const sku = `TK-DEMO-${categoryCode}-${String(index + 1).padStart(3, '0')}`;
    return {
    name,
    sku,
    description: additionalProductDescriptions[entry.name][index],
    price: 599 + categoryIndex * 250 + index * 175,
    discount: index % 4 === 0 ? 10 : 0,
    stock: 12 + ((index * 7) % 39),
  };
  });

  return { ...entry, products: [...entry.products, ...additions] };
});

async function seedCatalog() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  configureDnsServers();
  await mongoose.connect(process.env.MONGO_URI);

  let categoryCount = 0;
  let productCount = 0;
  let refreshedCount = 0;
  for (const entry of expandedCatalog) {
    const slug = entry.name.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-');
    let category = await Category.findOne({ slug });
    if (!category) {
      category = await Category.create({ name: entry.name, slug, description: entry.description, image: entry.image });
      categoryCount += 1;
    } else if (!category.isActive) {
      category.isActive = true;
      await category.save();
    }

    for (const item of entry.products) {
      let product = await Product.findOne({ sku: item.sku });
      if (!product) {
        const imageData = await productImageService.lookup(item.name, entry.name);
        product = await Product.create({
          name: item.name,
          sku: item.sku,
          description: item.description,
          price: item.price,
          discount: item.discount,
          category: category._id,
          stock: item.stock,
          ...imageData,
        });
        productCount += 1;
      } else {
        let changed = false;
        if (product.description !== item.description) {
          product.description = item.description;
          changed = true;
        }
        const existingImages = [...new Set([product.image, ...(product.images || [])].filter(isValidExternalImageUrl))];
        const primaryImage = isValidExternalImageUrl(product.image) ? product.image : existingImages[0];
        let imageData;
        if (!primaryImage || (() => { try { return new URL(primaryImage).hostname === 'loremflickr.com'; } catch { return false; } })()) {
          imageData = await productImageService.lookup(item.name, entry.name);
        } else {
          imageData = {
            image: primaryImage,
            images: existingImages,
            imageSource: product.imageSource || 'manual',
            imageCredit: product.imageCredit || '',
            imageCreditUrl: product.imageCreditUrl || '',
            imageSourceUrl: product.imageSourceUrl || '',
          };
        }
        if (product.image !== imageData.image || product.imageSource !== imageData.imageSource ||
            JSON.stringify(product.images || []) !== JSON.stringify(imageData.images)) {
          product.image = imageData.image;
          product.images = imageData.images;
          product.imageSource = imageData.imageSource;
          product.imageCredit = imageData.imageCredit || '';
          product.imageCreditUrl = imageData.imageCreditUrl || '';
          product.imageSourceUrl = imageData.imageSourceUrl || '';
          changed = true;
        }
        if (!product.isActive) {
          product.isActive = true;
          changed = true;
        }
        if (changed) {
          await product.save();
          refreshedCount += 1;
        }
      }
    }
  }

  console.log(`Catalog ready: ${categoryCount} categories, ${productCount} new products, and ${refreshedCount} existing demo products refreshed.`);
}

seedCatalog()
  .catch((error) => {
    console.error(`Catalog seeding failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

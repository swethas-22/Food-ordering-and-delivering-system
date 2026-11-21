import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parcelo_project.settings')
django.setup()

from decimal import Decimal
from django.utils import timezone
from accounts.models import User, UserProfile, Address, RecentSearch
from restaurants.models import Cuisine, Restaurant
from menu.models import FoodCategory, FoodItem, FoodCustomization
from cart.models import Coupon
from orders.models import Order, OrderItem, OrderTracking
from reviews.models import Review, Favorite
from assistant.models import AIConversation, AIMessage

def seed():
    print("Beginning bespoke database seeding for Parcelo...")

    # 1. CUISINES (FR-2.6: 9 Cuisines including Thai)
    cuisines_data = [
        ("Indian", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=400&q=80", 1),
        ("Italian", "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?auto=format&fit=crop&w=400&q=80", 2),
        ("Japanese", "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=80", 3),
        ("Mexican", "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80", 4),
        ("Lebanese", "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=400&q=80", 5),
        ("Continental", "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80", 6),
        ("Chinese", "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80", 7),
        ("Thai", "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=400&q=80", 8),
        ("Desserts", "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80", 9),
    ]

    cuisine_objs = {}
    for name, img, sort in cuisines_data:
        c, _ = Cuisine.objects.get_or_create(
            name=name,
            defaults={'image': img, 'sort_order': sort}
        )
        cuisine_objs[name] = c

    # 2. RESTAURANTS
    restaurants_data = [
        {
            "id": 1,
            "name": "The Royal Saffron Room",
            "cuisine": cuisine_objs["Indian"],
            "secondary_cuisines": "Mughlai, Kebabs, Dum Pukht",
            "rating": Decimal("4.90"),
            "review_count": 1420,
            "delivery_min_minutes": 25,
            "delivery_max_minutes": 30,
            "delivery_fee": Decimal("30.00"),
            "min_order": Decimal("249.00"),
            "is_pure_veg": False,
            "location": "Lavelle Road, Bengaluru",
            "badge": "Flagship Kitchen",
            "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
            "description": "Exquisite Awadhi & Nizami royal preparations crafted with Kashmiri saffron and aged spices."
        },
        {
            "id": 2,
            "name": "Osteria Tartufo & Burrata",
            "cuisine": cuisine_objs["Italian"],
            "secondary_cuisines": "Artisanal Pasta, Wood-Fired, Risotto",
            "rating": Decimal("4.80"),
            "review_count": 980,
            "delivery_min_minutes": 22,
            "delivery_max_minutes": 28,
            "delivery_fee": Decimal("0.00"),
            "min_order": Decimal("299.00"),
            "is_pure_veg": True,
            "location": "Indiranagar 12th Main, Bengaluru",
            "badge": "100% Pure Veg",
            "image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
            "description": "Authentic vegetarian Italian gastronomy featuring imported Umbrian truffles and Pugliese burrata."
        },
        {
            "id": 3,
            "name": "Kuroki Omakase & Ramen Bar",
            "cuisine": cuisine_objs["Japanese"],
            "secondary_cuisines": "Sushi, Ramen, Robata",
            "rating": Decimal("4.90"),
            "review_count": 1150,
            "delivery_min_minutes": 30,
            "delivery_max_minutes": 35,
            "delivery_fee": Decimal("40.00"),
            "min_order": Decimal("499.00"),
            "is_pure_veg": False,
            "location": "UB City, Vittal Mallya Rd",
            "badge": "Michelin Inspired",
            "image": "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&w=1200&q=80",
            "description": "Precision Japanese culinary mastery with fresh daily Norwegian salmon and 18-hour broth ramen."
        },
        {
            "id": 4,
            "name": "Cedar & Sumac Beirut Kitchen",
            "cuisine": cuisine_objs["Lebanese"],
            "secondary_cuisines": "Mediterranean, Mezze, Grills",
            "rating": Decimal("4.70"),
            "review_count": 760,
            "delivery_min_minutes": 20,
            "delivery_max_minutes": 25,
            "delivery_fee": Decimal("0.00"),
            "min_order": Decimal("199.00"),
            "is_pure_veg": False,
            "location": "Koramangala 4th Block",
            "badge": "Fastest Delivery",
            "image": "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1200&q=80",
            "description": "Vibrant Levantine delicacies featuring stone-ground tahini, fresh pomegranate, and slow-roasted skewers."
        },
        {
            "id": 5,
            "name": "Casa Oaxaca Cantina",
            "cuisine": cuisine_objs["Mexican"],
            "secondary_cuisines": "Tacos, Birria, Small Plates",
            "rating": Decimal("4.60"),
            "review_count": 640,
            "delivery_min_minutes": 24,
            "delivery_max_minutes": 29,
            "delivery_fee": Decimal("25.00"),
            "min_order": Decimal("249.00"),
            "is_pure_veg": False,
            "location": "HSR Layout Sector 2",
            "badge": "Trending Now",
            "image": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
            "description": "Heritage Mexican street food elevated with slow-braised adobo and heirloom blue-corn tortillas."
        },
        {
            "id": 6,
            "name": "Maison Lumière Bistro",
            "cuisine": cuisine_objs["Continental"],
            "secondary_cuisines": "French, European, Desserts",
            "rating": Decimal("4.80"),
            "review_count": 890,
            "delivery_min_minutes": 28,
            "delivery_max_minutes": 34,
            "delivery_fee": Decimal("35.00"),
            "min_order": Decimal("399.00"),
            "is_pure_veg": False,
            "location": "Sadashivanagar, Bengaluru",
            "badge": "Chef's Table",
            "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
            "description": "Modern Parisian bistro dining showcasing beurre blanc reductions, herb crusts, and delicate patisserie."
        },
        {
            "id": 7,
            "name": "Siam Botanica Royal Thai",
            "cuisine": cuisine_objs["Thai"],
            "secondary_cuisines": "Thai Curries, Pad Thai, Dim Sum",
            "rating": Decimal("4.90"),
            "review_count": 520,
            "delivery_min_minutes": 26,
            "delivery_max_minutes": 32,
            "delivery_fee": Decimal("30.00"),
            "min_order": Decimal("349.00"),
            "is_pure_veg": False,
            "location": "Ashok Nagar, Bengaluru",
            "badge": "Heritage Flavors",
            "image": "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=1200&q=80",
            "description": "Authentic royal Thai recipes made with kaffir lime, galangal, fresh coconut cream, and fragrant jasmine rice."
        },
    ]

    rest_objs = {}
    for r_data in restaurants_data:
        r_id = r_data.pop("id")
        r, _ = Restaurant.objects.update_or_create(
            id=r_id,
            defaults=r_data
        )
        rest_objs[r_id] = r

    # 3. COUPONS (FR-2.9, FR-5.7)
    coupons_data = [
        {
            "code": "PARCELO20",
            "title": "Bespoke Dining 20% Off",
            "description": "Enjoy 20% off up to ₹300 on all luxury culinary deliveries.",
            "conditions": "Valid on all orders • Cap ₹300",
            "kind": "percent",
            "value": Decimal("20.00"),
            "max_discount": Decimal("300.00"),
            "min_subtotal": Decimal("0.00"),
            "is_active": True
        },
        {
            "code": "FEAST150",
            "title": "Royal Feast ₹150 Flat Off",
            "description": "Get a flat ₹150 discount on gourmet culinary orders above ₹500.",
            "conditions": "Minimum order value ₹500",
            "kind": "flat",
            "value": Decimal("150.00"),
            "max_discount": Decimal("150.00"),
            "min_subtotal": Decimal("500.00"),
            "is_active": True
        },
        {
            "code": "PRIVEFREE",
            "title": "Privé White-Glove Complimentary Delivery",
            "description": "Enjoy free white-glove valet delivery on every order with no minimum limit.",
            "conditions": "No minimum spend required",
            "kind": "free_delivery",
            "value": Decimal("0.00"),
            "max_discount": None,
            "min_subtotal": Decimal("0.00"),
            "is_active": True
        }
    ]

    for c_data in coupons_data:
        Coupon.objects.update_or_create(code=c_data["code"], defaults=c_data)

    # 4. FOOD CATEGORIES
    cat_names = ["Starters", "Main Course", "Desserts", "Beverages"]
    cat_objs = {}
    for r_id, r in rest_objs.items():
        cat_objs[r_id] = {}
        for idx, cname in enumerate(cat_names):
            fc, _ = FoodCategory.objects.get_or_create(
                restaurant=r,
                name=cname,
                defaults={'sort_order': idx + 1}
            )
            cat_objs[r_id][cname] = fc

    # 5. FOOD ITEMS (Prototypes 101-112 + dedicated items for other restaurants)
    dishes_data = [
        {
            "id": 101,
            "restaurant": rest_objs[1],
            "category": cat_objs[1]["Main Course"],
            "name": "Nizam's Saffron Hyderabadi Dum Biryani",
            "price": Decimal("450.00"),
            "rating": Decimal("4.90"),
            "is_veg": False,
            "tag": "Bestseller",
            "is_trending": True,
            "is_chef_special": True,
            "description": "Aged basmati rice slow-cooked in a sealed handi with Kashmiri saffron, caramelized shallots, and tender spiced cuts.",
            "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
        },
        {
            "id": 102,
            "restaurant": rest_objs[1],
            "category": cat_objs[1]["Main Course"],
            "name": "Charcoal Paneer Tikka Lababdar",
            "price": Decimal("390.00"),
            "rating": Decimal("4.80"),
            "is_veg": True,
            "tag": "Popular",
            "is_trending": False,
            "is_chef_special": True,
            "description": "Smoked cottage cheese cubes simmered in a velvety heirloom tomato and cashew reduction with kasuri methi.",
            "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80"
        },
        {
            "id": 103,
            "restaurant": rest_objs[1],
            "category": cat_objs[1]["Starters"],
            "name": "Galouti Kebab & Saffron Sheermal",
            "price": Decimal("420.00"),
            "rating": Decimal("4.90"),
            "is_veg": False,
            "tag": "Chef Special",
            "is_trending": True,
            "is_chef_special": True,
            "description": "Melt-in-mouth Lucknowi spiced medallions served atop warm saffron-glazed flatbread with mint chutney.",
            "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80"
        },
        {
            "id": 104,
            "restaurant": rest_objs[1],
            "category": cat_objs[1]["Desserts"],
            "name": "Rosewater & Pistachio Shahi Tukda",
            "price": Decimal("260.00"),
            "rating": Decimal("4.80"),
            "is_veg": True,
            "tag": "Must Try",
            "is_trending": False,
            "is_chef_special": False,
            "description": "Cardamom-infused brioche soaked in reduced saffron rabri, garnished with Iranian pistachios and silver leaf.",
            "image": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80"
        },
        {
            "id": 112,
            "restaurant": rest_objs[1],
            "category": cat_objs[1]["Beverages"],
            "name": "Kashmiri Kahwa & Rose Iced Infusion",
            "price": Decimal("210.00"),
            "rating": Decimal("4.70"),
            "is_veg": True,
            "tag": "Refreshing",
            "is_trending": False,
            "is_chef_special": False,
            "description": "Chilled green tea steeped with saffron strands, crushed green cardamom, Damascus rose petals, and slivered almonds.",
            "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=600&q=80"
        },
        # Osteria Tartufo & Burrata
        {
            "id": 105,
            "restaurant": rest_objs[2],
            "category": cat_objs[2]["Main Course"],
            "name": "Black Truffle & Porcini Mushroom Risotto",
            "price": Decimal("640.00"),
            "rating": Decimal("4.90"),
            "is_veg": True,
            "tag": "Bestseller",
            "is_trending": True,
            "is_chef_special": True,
            "description": "Acquerello Carnaroli rice folded with 24-month aged Parmigiano-Reggiano, wild porcini, and Umbrian black truffle.",
            "image": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=600&q=80"
        },
        {
            "id": 106,
            "restaurant": rest_objs[2],
            "category": cat_objs[2]["Main Course"],
            "name": "Artisanal Burrata & San Marzano Tagliatelle",
            "price": Decimal("580.00"),
            "rating": Decimal("4.80"),
            "is_veg": True,
            "tag": "Popular",
            "is_trending": False,
            "is_chef_special": False,
            "description": "Hand-rolled ribbon pasta tossed in sweet Vesuvian tomato basil reduction crowned with fresh Pugliese burrata.",
            "image": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=600&q=80"
        },
        {
            "id": 113,
            "restaurant": rest_objs[2],
            "category": cat_objs[2]["Starters"],
            "name": "Wood-Fired Truffle Focaccia & Whipped Ricotta",
            "price": Decimal("380.00"),
            "rating": Decimal("4.85"),
            "is_veg": True,
            "tag": "Chef Special",
            "is_trending": True,
            "is_chef_special": True,
            "description": "Warm sourdough focaccia infused with rosemary, sea salt, truffle oil, and honey-whipped sheep's milk ricotta.",
            "image": "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=600&q=80"
        },
        {
            "id": 114,
            "restaurant": rest_objs[2],
            "category": cat_objs[2]["Desserts"],
            "name": "Classic Venetian Espresso Tiramisu",
            "price": Decimal("320.00"),
            "rating": Decimal("4.90"),
            "is_veg": True,
            "tag": "Must Try",
            "is_trending": False,
            "is_chef_special": True,
            "description": "Savoiardi ladyfingers soaked in dark roast Illy espresso, layered with airy mascarpone cream and Valrhona cocoa.",
            "image": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80"
        },
        # Kuroki Omakase & Ramen Bar
        {
            "id": 107,
            "restaurant": rest_objs[3],
            "category": cat_objs[3]["Starters"],
            "name": "Omakase Dragon Roll & Salmon Nigiri",
            "price": Decimal("790.00"),
            "rating": Decimal("4.90"),
            "is_veg": False,
            "tag": "Chef Special",
            "is_trending": True,
            "is_chef_special": True,
            "description": "8-piece torched avocado & tempura roll paired with 4 hand-pressed Norwegian salmon nigiri and fresh wasabi.",
            "image": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80"
        },
        {
            "id": 108,
            "restaurant": rest_objs[3],
            "category": cat_objs[3]["Main Course"],
            "name": "Kyoto Spicy Miso & Crispy Tofu Ramen",
            "price": Decimal("520.00"),
            "rating": Decimal("4.80"),
            "is_veg": True,
            "tag": "Bestseller",
            "is_trending": True,
            "is_chef_special": False,
            "description": "Rich roasted sesame & red miso broth with handmade noodles, charred bok choy, sweet corn, and chili oil.",
            "image": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80"
        },
        {
            "id": 115,
            "restaurant": rest_objs[3],
            "category": cat_objs[3]["Beverages"],
            "name": "Iced Ceremonial Uji Matcha Latte",
            "price": Decimal("280.00"),
            "rating": Decimal("4.85"),
            "is_veg": True,
            "tag": "Refreshing",
            "is_trending": False,
            "is_chef_special": False,
            "description": "Stone-ground first-harvest green tea from Kyoto whisked cold with oat milk and Madagascar vanilla bean.",
            "image": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80"
        },
        # Cedar & Sumac Beirut Kitchen
        {
            "id": 109,
            "restaurant": rest_objs[4],
            "category": cat_objs[4]["Starters"],
            "name": "Beirut Royal Mezze Platter & Za'atar Pita",
            "price": Decimal("490.00"),
            "rating": Decimal("4.90"),
            "is_veg": True,
            "tag": "Bestseller",
            "is_trending": False,
            "is_chef_special": True,
            "description": "Silky tahini hummus, smoky baba ganoush, crisp herb falafel, tabbouleh, pomegranate molasses, and warm pita.",
            "image": "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=600&q=80"
        },
        {
            "id": 116,
            "restaurant": rest_objs[4],
            "category": cat_objs[4]["Main Course"],
            "name": "Shish Tawook & Saffron Garlic Toum",
            "price": Decimal("540.00"),
            "rating": Decimal("4.85"),
            "is_veg": False,
            "tag": "Popular",
            "is_trending": True,
            "is_chef_special": True,
            "description": "Yogurt-marinated tender chicken breast cubes char-grilled over charcoal, served with fluffy garlic toum and batata harra.",
            "image": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"
        },
        # Casa Oaxaca Cantina
        {
            "id": 110,
            "restaurant": rest_objs[5],
            "category": cat_objs[5]["Main Course"],
            "name": "Smoked Chipotle Birria Tacos & Consommé",
            "price": Decimal("460.00"),
            "rating": Decimal("4.70"),
            "is_veg": False,
            "tag": "Trending",
            "is_trending": True,
            "is_chef_special": False,
            "description": "Three crispy heirloom blue-corn tortillas filled with slow-braised chipotle adobo, Oaxaca cheese, and dipping broth.",
            "image": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80"
        },
        # Maison Lumière Bistro
        {
            "id": 111,
            "restaurant": rest_objs[6],
            "category": cat_objs[6]["Main Course"],
            "name": "Herb-Crusted Norwegian Salmon & Asparagus",
            "price": Decimal("820.00"),
            "rating": Decimal("4.90"),
            "is_veg": False,
            "tag": "Chef Special",
            "is_trending": False,
            "is_chef_special": True,
            "description": "Pan-seared Atlantic salmon fillet with lemon-caper beurre blanc, charred asparagus, and truffle mash.",
            "image": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80"
        },
        # Siam Botanica Royal Thai
        {
            "id": 117,
            "restaurant": rest_objs[7],
            "category": cat_objs[7]["Main Course"],
            "name": "Royal Emerald Thai Green Curry & Jasmine Rice",
            "price": Decimal("520.00"),
            "rating": Decimal("4.90"),
            "is_veg": True,
            "tag": "Bestseller",
            "is_trending": True,
            "is_chef_special": True,
            "description": "Fragrant Thai green coconut curry with pea aubergines, sweet Thai basil, bamboo shoots, and steamed jasmine rice.",
            "image": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=600&q=80"
        },
    ]

    food_item_objs = {}
    for d_data in dishes_data:
        d_id = d_data.pop("id")
        food, _ = FoodItem.objects.update_or_create(
            id=d_id,
            defaults=d_data
        )
        food_item_objs[d_id] = food

    # 6. FOOD CUSTOMIZATIONS (FR-4.6, FR-4.7)
    customizations_data = [
        # Portions
        ("portion", "Regular", Decimal("0.00"), True),
        ("portion", "Large (+₹120)", Decimal("120.00"), False),
        ("portion", "Family Feast (+₹260)", Decimal("260.00"), False),
        # Spices
        ("spice", "Mild", Decimal("0.00"), False),
        ("spice", "Medium", Decimal("0.00"), True),
        ("spice", "Spicy", Decimal("0.00"), False),
        ("spice", "Fiery", Decimal("0.00"), False),
        # Extras
        ("extra", "Truffle Oil (+₹140)", Decimal("140.00"), False),
        ("extra", "Extra Burrata (+₹95)", Decimal("95.00"), False),
        ("extra", "Kasuri Methi Butter (+₹65)", Decimal("65.00"), False),
        ("extra", "Saffron Strands (+₹45)", Decimal("45.00"), False),
    ]

    for food in food_item_objs.values():
        for kind, name, delta, is_def in customizations_data:
            FoodCustomization.objects.get_or_create(
                food_item=food,
                kind=kind,
                name=name,
                defaults={'price_delta': delta, 'is_default': is_def}
            )

    # 7. DEMO USER & PROFILE (Aarav Mehta)
    user, created = User.objects.get_or_create(
        email="customer@parcelo.luxury",
        defaults={
            "username": "customer@parcelo.luxury",
            "full_name": "Aarav Mehta",
            "phone": "+91 98765 43210",
            "is_active": True
        }
    )
    if created or not user.has_usable_password():
        user.set_password("Parcelo@2026")
        user.save()

    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            "theme": "midnight",
            "dietary_preference": "all",
            "notify_orders": True,
            "notify_offers": True
        }
    )

    # Saved Addresses (FR-1.9)
    addresses = [
        ("Home", "Penthouse 14B, Koramangala 4th Block, Bengaluru", True),
        ("Work", "Prestige Tech Tower, Indiranagar 100ft Rd, Bengaluru", False),
        ("Villa", "Palm Meadows, Whitefield Main Rd, Bengaluru", False)
    ]
    for label, line, is_def in addresses:
        Address.objects.get_or_create(
            user=user,
            label=label,
            defaults={"line": line, "city": "Bengaluru", "pincode": "560034", "is_default": is_def}
        )

    # Recent Searches (FR-2.4)
    searches = ["Hyderabadi Biryani", "Truffle Risotto", "Omakase Sushi", "Lebanese Mezze"]
    for term in searches:
        RecentSearch.objects.get_or_create(user=user, term=term)

    # Initial Favorites (FR-7.7)
    Favorite.objects.get_or_create(user=user, restaurant=rest_objs[1])
    Favorite.objects.get_or_create(user=user, restaurant=rest_objs[2])
    Favorite.objects.get_or_create(user=user, food_item=food_item_objs[101])
    Favorite.objects.get_or_create(user=user, food_item=food_item_objs[105])

    # Past Orders (FR-7.2)
    # Order 1: PRC-8914 Delivered
    ord1, _ = Order.objects.get_or_create(
        order_number="PRC-8914",
        defaults={
            "user": user,
            "restaurant": rest_objs[1],
            "status": "delivered",
            "delivery_name": user.full_name,
            "delivery_phone": user.phone,
            "delivery_address": "Home — Penthouse 14B, Koramangala 4th Block, Bengaluru 560034",
            "payment_method": "upi",
            "payment_provider": "Google Pay",
            "payment_is_simulated": True,
            "subtotal": Decimal("710.00"),
            "discount": Decimal("0.00"),
            "delivery_fee": Decimal("30.00"),
            "tax": Decimal("35.50"),
            "total": Decimal("775.50"),
            "eta_minutes": 0,
            "created_at": timezone.now() - timezone.timedelta(days=4)
        }
    )
    if ord1.items.count() == 0:
        OrderItem.objects.create(
            order=ord1,
            food_item=food_item_objs[101],
            name=food_item_objs[101].name,
            unit_price=food_item_objs[101].price,
            quantity=1,
            options_summary="Regular • Medium Spice"
        )
        OrderItem.objects.create(
            order=ord1,
            food_item=food_item_objs[104],
            name=food_item_objs[104].name,
            unit_price=food_item_objs[104].price,
            quantity=1,
            options_summary="Regular • Iranian Pistachio Rabri"
        )
        OrderTracking.objects.create(order=ord1, status="delivered", note="Delivered at doorstep")
        Review.objects.create(user=user, order=ord1, restaurant=rest_objs[1], rating=5, comment="Unrivalled biryani and shahi tukda. Delivered hot and fragrant!")

    # Order 2: PRC-8790 Delivered
    ord2, _ = Order.objects.get_or_create(
        order_number="PRC-8790",
        defaults={
            "user": user,
            "restaurant": rest_objs[2],
            "status": "delivered",
            "delivery_name": user.full_name,
            "delivery_phone": user.phone,
            "delivery_address": "Work — Prestige Tech Tower, Indiranagar 100ft Rd, Bengaluru 560038",
            "payment_method": "card",
            "payment_provider": "Visa Signature",
            "payment_is_simulated": True,
            "subtotal": Decimal("640.00"),
            "discount": Decimal("0.00"),
            "delivery_fee": Decimal("0.00"),
            "tax": Decimal("32.00"),
            "total": Decimal("672.00"),
            "eta_minutes": 0,
            "created_at": timezone.now() - timezone.timedelta(days=9)
        }
    )
    if ord2.items.count() == 0:
        OrderItem.objects.create(
            order=ord2,
            food_item=food_item_objs[105],
            name=food_item_objs[105].name,
            unit_price=food_item_objs[105].price,
            quantity=1,
            options_summary="Regular • Umbrian Black Truffle"
        )
        OrderTracking.objects.create(order=ord2, status="delivered", note="Delivered at reception")

    # Initial AI Conversation (FR-8.2)
    ai_conv, _ = AIConversation.objects.get_or_create(
        user=user,
        title="Evening Tasting Suggestions",
    )
    if ai_conv.messages.count() == 0:
        AIMessage.objects.create(
            conversation=ai_conv,
            role="assistant",
            content="Good evening, Aarav! I'm your Parcelo Culinary Concierge. Tell me your mood, budget in ₹, or dietary preference—and I can add dishes straight to your bag.",
            dish_ids=[101, 105],
            outcome="ok"
        )

    print("Database seeding completed successfully with all luxury records!")

if __name__ == '__main__':
    seed()

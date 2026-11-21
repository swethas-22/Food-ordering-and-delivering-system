from django.test import TestCase
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from accounts.authentication import generate_tokens
from restaurants.models import Cuisine, Restaurant
from menu.models import FoodCategory, FoodItem, FoodCustomization
from cart.models import Cart, CartItem, Coupon
from orders.models import Order, OrderItem
from assistant.models import AIConversation, AIMessage
from assistant.views import conversation_messages

User = get_user_model()

class ParceloAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create users
        self.user1 = User.objects.create_user(
            username='user1@parcelo.luxury',
            email='user1@parcelo.luxury',
            password='Password@123',
            full_name='Test User One',
            phone='+91 99999 11111'
        )
        self.user2 = User.objects.create_user(
            username='user2@parcelo.luxury',
            email='user2@parcelo.luxury',
            password='Password@123',
            full_name='Test User Two',
            phone='+91 99999 22222'
        )
        self.tokens1 = generate_tokens(self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.tokens1['access']}")

        # Cuisines & Restaurants
        self.cuisine = Cuisine.objects.create(name='Indian', sort_order=1)
        self.rest1 = Restaurant.objects.create(
            name='Royal Saffron',
            cuisine=self.cuisine,
            rating=Decimal('4.90'),
            delivery_fee=Decimal('30.00'),
            min_order=Decimal('200.00'),
            is_available=True,
            is_published=True
        )
        self.rest2 = Restaurant.objects.create(
            name='Osteria Bella',
            cuisine=self.cuisine,
            rating=Decimal('4.80'),
            delivery_fee=Decimal('40.00'),
            min_order=Decimal('300.00'),
            is_available=True,
            is_published=True
        )

        # Dishes
        self.category = FoodCategory.objects.create(restaurant=self.rest1, name='Mains', sort_order=1)
        self.dish1 = FoodItem.objects.create(
            restaurant=self.rest1,
            category=self.category,
            name='Saffron Biryani',
            price=Decimal('400.00'),
            is_veg=False,
            is_available=True
        )
        self.opt_large = FoodCustomization.objects.create(
            food_item=self.dish1,
            kind='portion',
            name='Large (+₹100)',
            price_delta=Decimal('100.00')
        )
        self.dish2 = FoodItem.objects.create(
            restaurant=self.rest2,
            category=self.category,
            name='Truffle Pasta',
            price=Decimal('500.00'),
            is_veg=True,
            is_available=True
        )

        # Coupon
        self.coupon = Coupon.objects.create(
            code='FEAST150',
            kind='flat',
            value=Decimal('150.00'),
            min_subtotal=Decimal('500.00'),
            is_active=True
        )

    def test_auth_registration_and_login(self):
        # Register new
        res = self.client.post('/api/auth/register/', {
            'email': 'newcustomer@parcelo.luxury',
            'full_name': 'New Customer',
            'phone': '+91 98888 77777',
            'password': 'SecurePassword@1',
            'password_confirm': 'SecurePassword@1'
        })
        self.assertEqual(res.status_code, 201)
        self.assertIn('access', res.data)

        # Login
        res_login = self.client.post('/api/auth/login/', {
            'email': 'newcustomer@parcelo.luxury',
            'password': 'SecurePassword@1'
        })
        self.assertEqual(res_login.status_code, 200)
        self.assertIn('access', res_login.data)

    def test_cart_item_addition_and_server_price_calculation(self):
        # Add customized dish (base 400 + 100 large = 500)
        res = self.client.post('/api/cart/items/', {
            'food_item': self.dish1.id,
            'quantity': 1,
            'options': [self.opt_large.id],
            'instructions': 'Extra dry fruits'
        })
        self.assertEqual(res.status_code, 201)
        bill = res.data['bill']
        self.assertEqual(bill['subtotal'], '500.00')
        # Tax is 5% of 500 = 25.00
        self.assertEqual(bill['tax'], '25.00')
        # Delivery fee is 30.00
        self.assertEqual(bill['delivery_fee'], '30.00')
        # Total = 500 + 30 + 25 = 555.00
        self.assertEqual(bill['total'], '555.00')

    def test_cart_restaurant_conflict(self):
        # Add item from rest1
        self.client.post('/api/cart/items/', {'food_item': self.dish1.id, 'quantity': 1})
        # Attempt to add from rest2 without replace
        res = self.client.post('/api/cart/items/', {'food_item': self.dish2.id, 'quantity': 1})
        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.data['code'], 'restaurant_conflict')

        # Add with replace=True
        res_replace = self.client.post('/api/cart/items/', {'food_item': self.dish2.id, 'quantity': 1, 'replace': True})
        self.assertEqual(res_replace.status_code, 201)
        self.assertEqual(res_replace.data['restaurant_id'], self.rest2.id)

    def test_coupon_validation(self):
        # Cart with dish1 (400 subtotal, below FEAST150 min 500)
        self.client.post('/api/cart/items/', {'food_item': self.dish1.id, 'quantity': 1, 'replace': True})
        res_coupon = self.client.post('/api/cart/coupon/', {'code': 'FEAST150'})
        self.assertEqual(res_coupon.status_code, 400)
        self.assertEqual(res_coupon.data['code'], 'coupon_invalid')

        # Increase quantity to 2 (800 subtotal)
        self.client.post('/api/cart/items/', {'food_item': self.dish1.id, 'quantity': 1})
        res_coupon_ok = self.client.post('/api/cart/coupon/', {'code': 'FEAST150'})
        self.assertEqual(res_coupon_ok.status_code, 200)
        self.assertEqual(res_coupon_ok.data['bill']['discount'], '150.00')

    def test_order_creation_and_cancellation_rules(self):
        # Fill cart
        self.client.post('/api/cart/items/', {'food_item': self.dish1.id, 'quantity': 1, 'replace': True})
        # Place order
        res_order = self.client.post('/api/orders/', {
            'payment_method': 'upi',
            'delivery_instruction': 'leave_at_door'
        })
        self.assertEqual(res_order.status_code, 201)
        order_id = res_order.data['id']
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, 'placed')

        # Cancel while placed -> SUCCESS
        res_cancel = self.client.post(f'/api/orders/{order_id}/cancel/')
        self.assertEqual(res_cancel.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.status, 'cancelled')

        # Advance another order to preparing and attempt cancellation
        self.client.post('/api/cart/items/', {'food_item': self.dish1.id, 'quantity': 1})
        res_order2 = self.client.post('/api/orders/', {'payment_method': 'upi'})
        order2 = Order.objects.get(id=res_order2.data['id'])
        order2.status = 'preparing'
        order2.save()

        # Cancellation should be refused with 409 (FR-6.6)
        res_cancel_blocked = self.client.post(f'/api/orders/{order2.id}/cancel/')
        self.assertEqual(res_cancel_blocked.status_code, 409)
        self.assertEqual(res_cancel_blocked.data['code'], 'cancel_forbidden')

    def test_ownership_enforcement(self):
        # user1 creates order
        self.client.post('/api/cart/items/', {'food_item': self.dish1.id, 'quantity': 1})
        res = self.client.post('/api/orders/', {'payment_method': 'upi'})
        order_id = res.data['id']

        # user2 attempts to view user1's order -> 404
        tokens2 = generate_tokens(self.user2)
        client2 = APIClient()
        client2.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens2['access']}")
        res_other = client2.get(f'/api/orders/{order_id}/')
        self.assertEqual(res_other.status_code, 404)

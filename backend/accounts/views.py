from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .models import User, UserProfile, Address, RecentSearch
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    AddressSerializer, UserProfileSerializer, RecentSearchSerializer
)
from .authentication import generate_tokens, rotate_refresh_token, blacklist_token

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = generate_tokens(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'message': 'Account created successfully.'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email'].lower()
    password = serializer.validated_data['password']
    
    user = authenticate(request, username=email, password=password)
    if not user:
        try:
            u = User.objects.get(email__iexact=email)
            if u.check_password(password):
                user = u
        except User.DoesNotExist:
            user = None

    if not user:
        return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active:
        return Response({'detail': 'User account is disabled.'}, status=status.HTTP_401_UNAUTHORIZED)

    tokens = generate_tokens(user)
    return Response({
        'user': UserSerializer(user).data,
        'access': tokens['access'],
        'refresh': tokens['refresh']
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def token_refresh_view(request):
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'detail': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        new_tokens = rotate_refresh_token(refresh_token)
        return Response(new_tokens, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    refresh_token = request.data.get('refresh')
    if refresh_token:
        blacklist_token(refresh_token)
    return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_205_RESET_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_view(request):
    # FR-1.6: Collects email and responds identically whether or not registered
    email = request.data.get('email', '')
    return Response({
        'detail': f'If an account with {email} exists, password reset instructions have been dispatched.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def otp_request_view(request):
    phone = request.data.get('phone', '')
    if not phone:
        return Response({'detail': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)
    return Response({
        'detail': 'OTP has been dispatched via SMS simulation.',
        'phone': phone
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def otp_verify_view(request):
    phone = request.data.get('phone', '')
    otp = request.data.get('otp', '')
    name = request.data.get('name', 'Privé Member')
    if not phone or not otp:
        return Response({'detail': 'Phone and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Sign in or register user by phone
    user, created = User.objects.get_or_create(
        phone=phone,
        defaults={
            'username': f"user_{phone[-6:] if len(phone)>=6 else phone}",
            'email': f"user_{phone}@parcelo.luxury",
            'full_name': name
        }
    )
    if created:
        UserProfile.objects.create(user=user)
    
    tokens = generate_tokens(user)
    return Response({
        'user': UserSerializer(user).data,
        'access': tokens['access'],
        'refresh': tokens['refresh']
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if request.method == 'GET':
        return Response(UserSerializer(user).data)
    
    # PATCH
    data = request.data
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'email' in data and data['email'] != user.email:
        if User.objects.filter(email__iexact=data['email']).exclude(pk=user.pk).exists():
            return Response({'email': 'Email is already taken.'}, status=status.HTTP_400_BAD_REQUEST)
        user.email = data['email']
        user.username = data['email']
    if 'phone' in data:
        user.phone = data['phone']
    user.save()

    if 'dietary_preference' in data:
        profile.dietary_preference = data['dietary_preference']
    if 'theme' in data:
        profile.theme = data['theme']
    if 'avatar' in data:
        profile.avatar = data['avatar']
    profile.save()

    return Response(UserSerializer(user).data)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def preferences_view(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if request.method == 'GET':
        return Response({
            'theme': profile.theme,
            'notify_orders': profile.notify_orders,
            'notify_offers': profile.notify_offers,
            'dietary_preference': profile.dietary_preference,
        })
    
    data = request.data
    if 'theme' in data and data['theme'] in ['midnight', 'royal', 'velvet']:
        profile.theme = data['theme']
    if 'notify_orders' in data:
        profile.notify_orders = bool(data['notify_orders'])
    if 'notify_offers' in data:
        profile.notify_offers = bool(data['notify_offers'])
    if 'dietary_preference' in data:
        profile.dietary_preference = data['dietary_preference']
    profile.save()

    return Response({
        'theme': profile.theme,
        'notify_orders': profile.notify_orders,
        'notify_offers': profile.notify_offers,
        'dietary_preference': profile.dietary_preference,
    })


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def addresses_list_create(request):
    if request.method == 'GET':
        addresses = Address.objects.filter(user=request.user)
        return Response(AddressSerializer(addresses, many=True).data)
    
    # POST
    serializer = AddressSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        addr = serializer.save()
        return Response(AddressSerializer(addr).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def address_detail(request, pk):
    try:
        addr = Address.objects.get(pk=pk, user=request.user)
    except Address.DoesNotExist:
        return Response({'detail': 'Address not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'DELETE':
        addr.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    serializer = AddressSerializer(addr, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def recent_searches_view(request):
    if request.method == 'GET':
        searches = RecentSearch.objects.filter(user=request.user)[:6]
        return Response(RecentSearchSerializer(searches, many=True).data)
    
    if request.method == 'POST':
        term = request.data.get('term', '').strip()
        if not term:
            return Response({'detail': 'Search term required.'}, status=status.HTTP_400_BAD_REQUEST)
        # FR-2.4: Keep latest 6 per user
        RecentSearch.objects.filter(user=request.user, term__iexact=term).delete()
        entry = RecentSearch.objects.create(user=request.user, term=term)
        # Prune older than 6
        all_ids = list(RecentSearch.objects.filter(user=request.user).values_list('id', flat=True)[:6])
        RecentSearch.objects.filter(user=request.user).exclude(id__in=all_ids).delete()
        return Response(RecentSearchSerializer(entry).data, status=status.HTTP_201_CREATED)

    if request.method == 'DELETE':
        RecentSearch.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

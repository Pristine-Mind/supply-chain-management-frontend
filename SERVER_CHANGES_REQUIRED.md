# Server-Side Changes Required - Search & Filter Implementation

**Last Updated:** March 31, 2026  
**Priority Level:** HIGH  
**Estimated Development Time:** 2-3 weeks

---

## Overview

This document outlines all backend changes required to fix search and filter functionality. Current issues affect product discovery, filtering accuracy, and user experience across the marketplace.

---

## 🔴 CRITICAL (Fix Immediately)

### 1. City Filter - Broken Query
**Impact:** Users can only see products from Kathmandu  
**Severity:** CRITICAL  
**Effort:** 2-3 hours

#### Current Problem
```python
# BROKEN QUERY:
city = request.query_params.get('city')
products = products.filter(seller__city__name=city)
# Issues:
# - Case-sensitive comparison fails (Kathmandu vs kathmandu)
# - Seller relationship may not exist
# - No fallback if city is passed as ID instead of name
```

#### Required Fix
```python
# File: your_app/views.py or your_app/serializers.py
# Endpoint: GET /api/v1/marketplace/

from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def marketplace_list(request):
    """
    List marketplace products with city filtering
    Query params:
    - city: City name (e.g., 'kathmandu') or city ID (e.g., '1')
    - search: Search query
    - min_price: Minimum price
    - max_price: Maximum price
    """
    products = MarketplaceProduct.objects.select_related(
        'seller',
        'seller__profile',
        'product_details'
    ).filter(is_available=True)
    
    # City filter - FIXED
    city = request.query_params.get('city')
    if city:
        try:
            # Try as city ID first
            city_id = int(city)
            products = products.filter(seller__profile__city__id=city_id)
        except (ValueError, TypeError):
            # Fall back to city name (case-insensitive)
            products = products.filter(
                Q(seller__profile__city__name__iexact=city) |
                Q(seller__location__iexact=city)
            )
    
    # Other filters...
    search = request.query_params.get('search')
    if search:
        products = products.filter(
            product_details__name__icontains=search
        )
    
    serializer = MarketplaceProductSerializer(products, many=True)
    return Response({
        'status': 'success',
        'count': products.count(),
        'results': serializer.data
    })
```

#### Database Check Needed
```sql
-- Verify seller-city relationship
SELECT u.id, u.username, p.city_id, c.name as city_name
FROM auth_user u
JOIN user_profile p ON u.id = p.user_id
JOIN city c ON p.city_id = c.id
LIMIT 10;

-- Ensure all marketplace products have sellers
SELECT mp.id, mp.seller_id, s.username, p.city_id
FROM marketplace_product mp
LEFT JOIN auth_user s ON mp.seller_id = s.id
LEFT JOIN user_profile p ON s.id = p.user_id
WHERE mp.seller_id IS NULL OR p.city_id IS NULL
LIMIT 10;
```

#### Endpoint to Add (Optional but Helpful)
```python
# File: your_app/views.py
# Endpoint: GET /api/v1/cities/

@api_view(['GET'])
def list_cities(request):
    """List all cities with product counts"""
    from django.db.models import Count
    
    cities = City.objects.annotate(
        product_count=Count('user_profile__marketplace_products')
    ).filter(product_count__gt=0).order_by('-product_count')
    
    return Response({
        'status': 'success',
        'results': [
            {
                'id': city.id,
                'name': city.name,
                'product_count': city.product_count
            }
            for city in cities
        ]
    })
```

---

### 2. Product Ratings Not Updating After Review
**Impact:** Users see stale ratings after submitting reviews  
**Severity:** CRITICAL  
**Effort:** 2-4 hours

#### Current Problem
```python
# Reviews created but average rating never recalculated
class ReviewSubmitView(APIView):
    def post(self, request, product_id):
        review = ProductReview.objects.create(
            product_id=product_id,
            rating=request.data['rating'],
            text=request.data['text'],
            user=request.user
        )
        return Response({'success': 'Review added'})  # WRONG - doesn't update rating
```

#### Required Fix
```python
# File: your_app/models.py

from django.db import models
from django.db.models import Avg
from decimal import Decimal

class ProductReview(models.Model):
    product = models.ForeignKey('MarketplaceProduct', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    review_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['product', 'user']  # One review per user per product
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        """Recalculate product rating after review save"""
        super().save(*args, **kwargs)
        # Trigger product rating update
        self.product.update_average_rating()
    
    def delete(self, *args, **kwargs):
        """Recalculate product rating after review delete"""
        product = self.product
        super().delete(*args, **kwargs)
        product.update_average_rating()


class MarketplaceProduct(models.Model):
    # ... existing fields ...
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal('0.0'))
    total_reviews = models.IntegerField(default=0)
    rating_1_count = models.IntegerField(default=0)  # For breakdown
    rating_2_count = models.IntegerField(default=0)
    rating_3_count = models.IntegerField(default=0)
    rating_4_count = models.IntegerField(default=0)
    rating_5_count = models.IntegerField(default=0)
    
    def update_average_rating(self):
        """Recalculate average rating and breakdown from all reviews"""
        reviews = self.reviews.all()
        
        if not reviews.exists():
            self.average_rating = Decimal('0.0')
            self.total_reviews = 0
            self.rating_1_count = 0
            self.rating_2_count = 0
            self.rating_3_count = 0
            self.rating_4_count = 0
            self.rating_5_count = 0
        else:
            # Calculate average
            avg_result = reviews.aggregate(
                avg_rating=Avg('rating')
            )
            self.average_rating = Decimal(str(avg_result['avg_rating'])).quantize(Decimal('0.01'))
            self.total_reviews = reviews.count()
            
            # Calculate breakdown
            self.rating_1_count = reviews.filter(rating=1).count()
            self.rating_2_count = reviews.filter(rating=2).count()
            self.rating_3_count = reviews.filter(rating=3).count()
            self.rating_4_count = reviews.filter(rating=4).count()
            self.rating_5_count = reviews.filter(rating=5).count()
        
        # Use update_fields to avoid recursion
        self.save(update_fields=[
            'average_rating', 'total_reviews',
            'rating_1_count', 'rating_2_count', 'rating_3_count',
            'rating_4_count', 'rating_5_count'
        ])
    
    def get_ratings_breakdown(self):
        """Return ratings breakdown as percentage"""
        if self.total_reviews == 0:
            return {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        
        divisor = self.total_reviews
        return {
            5: round((self.rating_5_count / divisor) * 100, 1),
            4: round((self.rating_4_count / divisor) * 100, 1),
            3: round((self.rating_3_count / divisor) * 100, 1),
            2: round((self.rating_2_count / divisor) * 100, 1),
            1: round((self.rating_1_count / divisor) * 100, 1),
        }


# File: your_app/views.py

class ProductReviewView(APIView):
    def post(self, request, product_id):
        """Submit a product review"""
        product = get_object_or_404(MarketplaceProduct, id=product_id)
        
        # Validate input
        rating = request.data.get('rating')
        review_text = request.data.get('text', '')
        
        if not rating or rating not in [1, 2, 3, 4, 5]:
            return Response(
                {'error': 'Rating must be between 1 and 5'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(review_text) < 10:
            return Response(
                {'error': 'Review text must be at least 10 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update review
        review, created = ProductReview.objects.update_or_create(
            product=product,
            user=request.user,
            defaults={
                'rating': rating,
                'review_text': review_text
            }
        )
        
        # Product rating is automatically updated in the save() method
        # Refresh product to get updated values
        product.refresh_from_db()
        
        return Response({
            'status': 'success',
            'message': 'Review added successfully' if created else 'Review updated successfully',
            'review': {
                'id': review.id,
                'rating': review.rating,
                'text': review.review_text,
                'created_at': review.created_at
            },
            'product_updated': {
                'id': product.id,
                'average_rating': float(product.average_rating),
                'total_reviews': product.total_reviews,
                'ratings_breakdown': product.get_ratings_breakdown()
            }
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
```

#### Database Migration Needed
```python
# File: your_app/migrations/XXXX_add_rating_fields.py

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('your_app', 'previous_migration'),
    ]
    
    operations = [
        migrations.AddField(
            model_name='marketplaceproduct',
            name='average_rating',
            field=models.DecimalField(decimal_places=2, default='0.0', max_digits=3),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='total_reviews',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='rating_1_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='rating_2_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='rating_3_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='rating_4_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='marketplaceproduct',
            name='rating_5_count',
            field=models.IntegerField(default=0),
        ),
        # Run data migration to populate existing ratings
        migrations.RunPython(populate_ratings),
    ]

def populate_ratings(apps, schema_editor):
    """Populate rating fields for existing products"""
    MarketplaceProduct = apps.get_model('your_app', 'MarketplaceProduct')
    for product in MarketplaceProduct.objects.all():
        product.update_average_rating()
```

---

### 3. Color Filter - Values Not Normalized
**Impact:** Color filters don't return all matching products (case-sensitive, format issues)  
**Severity:** CRITICAL  
**Effort:** 3-4 hours

#### Current Problem
```python
# Colors stored inconsistently:
# - "Red" in one product
# - "RED" in another
# - "red" in third
# - "Crimson" as an alias
# Filter doesn't match them
```

#### Required Fix
```python
# File: your_app/models.py

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

# Define standard colors
COLOR_CHOICES = [
    ('red', 'Red'),
    ('blue', 'Blue'),
    ('black', 'Black'),
    ('white', 'White'),
    ('green', 'Green'),
    ('yellow', 'Yellow'),
    ('orange', 'Orange'),
    ('pink', 'Pink'),
    ('purple', 'Purple'),
    ('brown', 'Brown'),
    ('gray', 'Gray'),
    ('silver', 'Silver'),
    ('gold', 'Gold'),
    ('beige', 'Beige'),
    ('navy', 'Navy'),
    ('turquoise', 'Turquoise'),
    ('maroon', 'Maroon'),
    ('tan', 'Tan'),
    ('multi', 'Multi-color'),
    ('other', 'Other'),
]

# Color normalization mapping
COLOR_ALIASES = {
    'red': ['RED', 'crimson', 'rouge', '红', 'rojo', 'rot'],
    'blue': ['BLUE', 'navy', 'cyan', '蓝', 'azul', 'blau'],
    'black': ['BLACK', 'noir', '黑', 'negro', 'schwarz'],
    'white': ['WHITE', 'cream', 'ivory', '白', 'blanco', 'weiß'],
    'yellow': ['YELLOW', 'gold', '黄', 'amarillo', 'gelb'],
    'green': ['GREEN', 'lime', 'mint', '绿', 'verde', 'grün'],
    'pink': ['PINK', 'rose', 'magenta', '粉', 'rosa', 'rosa'],
    'purple': ['PURPLE', 'violet', 'lavender', '紫', 'morado', 'lila'],
    'orange': ['ORANGE', '橙', 'naranja', 'orange'],
    'brown': ['BROWN', 'tan', 'beige', '棕', 'marrón', 'braun'],
    'gray': ['GRAY', 'grey', 'silver', '灰', 'gris', 'grau'],
}

def normalize_color(color_input):
    """Normalize color value to standard format"""
    if not color_input:
        return None
    
    color_lower = str(color_input).lower().strip()
    
    # Check if it's already a valid choice
    valid_colors = [choice[0] for choice in COLOR_CHOICES]
    if color_lower in valid_colors:
        return color_lower
    
    # Check aliases
    for standard_color, aliases in COLOR_ALIASES.items():
        if color_lower in [alias.lower() for alias in aliases]:
            return standard_color
    
    # Default: return as-is if not found (or could return 'other')
    return 'other' if color_lower not in valid_colors else color_lower


class ProductVariant(models.Model):
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    color = models.CharField(
        max_length=50,
        choices=COLOR_CHOICES,
        blank=True,
        null=True
    )
    size = models.CharField(max_length=50, blank=True)
    stock = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self, *args, **kwargs):
        """Normalize color before saving"""
        if self.color:
            self.color = normalize_color(self.color)
        super().save(*args, **kwargs)
    
    class Meta:
        unique_together = ['product', 'color', 'size']


# File: your_app/views.py or your_app/serializers.py

from django.db.models import Q

class MarketplaceListView(APIView):
    def get(self, request):
        """Get marketplace products with color filtering"""
        products = MarketplaceProduct.objects.all()
        
        # Color filter - FIXED
        colors = request.query_params.getlist('colors')  # Multiple colors
        if colors:
            # Normalize input colors
            normalized_colors = [normalize_color(c) for c in colors]
            # Remove None values
            normalized_colors = [c for c in normalized_colors if c]
            
            if normalized_colors:
                # Filter products that have variants with these colors
                products = products.filter(
                    variants__color__in=normalized_colors
                ).distinct()
        
        return Response({
            'status': 'success',
            'results': MarketplaceProductSerializer(products, many=True).data
        })
```

#### Data Migration Script
```python
# File: your_app/management/commands/normalize_colors.py

from django.core.management.base import BaseCommand
from your_app.models import ProductVariant, normalize_color

class Command(BaseCommand):
    help = 'Normalize all color values in database'
    
    def handle(self, *args, **options):
        total = 0
        updated = 0
        
        for variant in ProductVariant.objects.all():
            total += 1
            if variant.color:
                normalized = normalize_color(variant.color)
                if normalized != variant.color:
                    variant.color = normalized
                    variant.save(update_fields=['color'])
                    updated += 1
                    print(f"Updated: {variant.product.name} - {variant.id}")
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Total variants: {total}, Updated: {updated}'
            )
        )

# Run with: python manage.py normalize_colors
```

---

## 🟠 HIGH PRIORITY (Fix Next)

### 4. Search Relevance - Laptop Returns Laptop Bag
**Impact:** Search results are not relevant  
**Severity:** HIGH  
**Effort:** 4-6 hours

#### Current Problem
```python
# Full-text search returns any product containing keywords
# No relevance ranking or category weighting
# "laptop" returns laptop bags, cases, stands, etc.
```

#### Required Fix
```python
# File: your_app/views.py

from django.db.models import Q, Value, F, CharField, Case, When, DecimalField
from django.db.models.functions import Concat, Length
from decimal import Decimal

class SearchOptimizedView(APIView):
    def get(self, request):
        """
        Optimized search with relevance ranking
        Query params:
        - search: Search query
        - category: Category ID for context
        """
        query = request.query_params.get('search', '').strip()
        
        if not query or len(query) < 2:
            return Response({'status': 'success', 'results': []})
        
        category_id = request.query_params.get('category')
        products = MarketplaceProduct.objects.select_related('product_details')
        
        # Split query into terms
        terms = query.lower().split()
        main_term = terms[0]
        
        # Build relevance score
        relevance_cases = [
            # Exact name match (highest priority) - 100 points
            When(
                product_details__name__iexact=query,
                then=Value(100, output_field=DecimalField())
            ),
            # Exact first word match - 90 points
            When(
                product_details__name__istartswith=main_term,
                then=Value(90, output_field=DecimalField())
            ),
            # Category match - 80 points (if category specified)
            When(
                product_details__category__name__iexact=main_term,
                then=Value(80, output_field=DecimalField())
            ),
            # All terms in name - 70 points
            When(
                **{
                    'product_details__name__icontains': query,
                    then: Value(70, output_field=DecimalField())
                }
            ),
            # Single word contains - 50 points
            When(
                product_details__name__icontains=main_term,
                then=Value(50, output_field=DecimalField())
            ),
            # Description contains - 30 points
            When(
                product_details__description__icontains=query,
                then=Value(30, output_field=DecimalField())
            ),
        ]
        
        products = products.annotate(
            relevance_score=Case(*relevance_cases, default=Value(0))
        ).filter(relevance_score__gt=0)
        
        # Additional filtering for category context
        if category_id:
            products = products.filter(product_details__category_id=category_id)
        
        # Sort by relevance, then by popularity/rating
        products = products.annotate(
            search_score=F('relevance_score') + (F('average_rating') * 5)
        ).order_by('-search_score', '-average_rating', '-view_count')
        
        # Limit results
        limit = int(request.query_params.get('limit', 50))
        products = products[:limit]
        
        return Response({
            'status': 'success',
            'count': len(products),
            'results': MarketplaceProductSerializer(products, many=True).data
        })
```

#### Elasticsearch Alternative (If Available)
```python
# File: your_app/search.py (if using elasticsearch)

from elasticsearch_dsl import Search, Q, A
from elasticsearch import Elasticsearch

class ProductSearch:
    def __init__(self):
        self.client = Elasticsearch(['localhost:9200'])
    
    def search(self, query, category=None):
        """Advanced search with relevance ranking"""
        s = Search(using=self.client, index='products')
        
        # Build query with boosted fields
        q = Q('bool', should=[
            Q('match', name={'query': query, 'boost': 10}),  # Exact name
            Q('match_phrase', name={'query': query, 'boost': 8}),  # Phrase match
            Q('match', category={'query': query, 'boost': 5}),  # Category match
            Q('match', description={'query': query}),  # Description
        ])
        
        s = s.query(q)
        
        # Filter by category if specified
        if category:
            s = s.filter('term', category_id=category)
        
        # Add aggregations for faceted search
        s.aggs.bucket('colors', A('terms', field='colors', size=100))
        s.aggs.bucket('sizes', A('terms', field='sizes', size=100))
        s.aggs.bucket('prices', A('range', field='price', ranges=[
            {'to': 1000},
            {'from': 1000, 'to': 5000},
            {'from': 5000, 'to': 10000},
            {'from': 10000}
        ]))
        
        # Sort by score and popularity
        s = s.sort('-_score', '-popularity')
        
        return s[0:50].execute()
```

---

### 5. Size Filter - Not Working
**Impact:** Users cannot filter products by size  
**Severity:** HIGH  
**Effort:** 3-5 hours

#### Current Problem
```python
# Sizes not properly associated with products
# No size filtering in API
# Missing Size model
```

#### Required Fix
```python
# File: your_app/models.py

SIZE_UNIT_CHOICES = [
    ('numeric', 'Numeric (36, 37, 38...)'),
    ('metric', 'Metric (XS, S, M, L, XL)'),
    ('custom', 'Custom (Small, Medium, Large)'),
]

STANDARD_SIZES = {
    'metric': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    'numeric': [str(i) for i in range(20, 60)] + [f'{i}.5' for i in range(20, 60)],
}

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    color = models.CharField(
        max_length=50,
        choices=COLOR_CHOICES,
        blank=True,
        null=True
    )
    size = models.CharField(max_length=50, blank=True)
    size_unit = models.CharField(
        max_length=20,
        choices=SIZE_UNIT_CHOICES,
        default='metric',
        blank=True
    )
    stock = models.IntegerField(default=0)
    sku = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
    class Meta:
        unique_together = ['product', 'color', 'size']
        indexes = [
            models.Index(fields=['size', 'size_unit']),
            models.Index(fields=['product', 'size']),
        ]


class MarketplaceProduct(models.Model):
    # ... existing fields ...
    
    # Denormalize available sizes for faster queries
    available_sizes = models.JSONField(default=list)  # ['S', 'M', 'L']
    size_unit = models.CharField(
        max_length=20,
        choices=SIZE_UNIT_CHOICES,
        default='metric'
    )
    
    def update_available_sizes(self):
        """Update available sizes from variants"""
        sizes = self.variants.filter(
            stock__gt=0
        ).values_list('size', flat=True).distinct()
        
        self.available_sizes = sorted(list(sizes))
        self.save(update_fields=['available_sizes'])


# File: your_app/views.py

class MarketplaceFilterView(APIView):
    def get(self, request):
        """Get products with size filtering"""
        products = MarketplaceProduct.objects.all()
        
        # Size filter
        sizes = request.query_params.getlist('sizes')  # Multiple sizes
        if sizes:
            # Filter products that have variants with these sizes
            products = products.filter(
                variants__size__in=sizes,
                variants__stock__gt=0
            ).distinct()
        
        # Alternative: Use denormalized field for faster queries
        # if sizes:
        #     products = products.filter(available_sizes__overlap=sizes)
        
        return Response({
            'status': 'success',
            'count': products.count(),
            'results': MarketplaceProductSerializer(products, many=True).data
        })

# File: your_app/serializers.py

class MarketplaceProductSerializer(serializers.ModelSerializer):
    available_sizes = serializers.SerializerMethodField()
    available_colors = serializers.SerializerMethodField()
    
    class Meta:
        model = MarketplaceProduct
        fields = [
            'id', 'name', 'price', 'available_sizes', 'available_colors',
            'average_rating', 'total_reviews', 'stock', 'image', 'city'
        ]
    
    def get_available_sizes(self, obj):
        """Get unique available sizes"""
        return list(
            obj.variants.filter(stock__gt=0)
            .values_list('size', flat=True)
            .distinct()
        )
    
    def get_available_colors(self, obj):
        """Get unique available colors"""
        return list(
            obj.variants.filter(stock__gt=0)
            .values_list('color', flat=True)
            .distinct()
        )
```

#### Update Signal
```python
# File: your_app/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from your_app.models import ProductVariant

@receiver(post_save, sender=ProductVariant)
def update_product_sizes_on_variant_change(sender, instance, **kwargs):
    """Update available sizes when variant is added/modified"""
    instance.product.update_available_sizes()

@receiver(post_delete, sender=ProductVariant)
def update_product_sizes_on_variant_delete(sender, instance, **kwargs):
    """Update available sizes when variant is deleted"""
    instance.product.update_available_sizes()

# In your_app/apps.py
class YourAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'your_app'
    
    def ready(self):
        import your_app.signals
```

---

### 6. Delivery Time Filter - Not Implemented
**Impact:** Users cannot filter by delivery time  
**Severity:** HIGH  
**Effort:** 3-4 hours

#### Current Problem
```python
# No delivery time filtering
# No estimated delivery calculation
# No delivery options available
```

#### Required Fix
```python
# File: your_app/models.py

from datetime import datetime, timedelta

class MarketplaceProduct(models.Model):
    # ... existing fields ...
    seller_location = models.PointField(null=True, blank=True)  # Uses GIS
    warehouse_location = models.PointField(null=True, blank=True)
    estimated_delivery_days = models.IntegerField(null=True, blank=True)
    available_delivery_options = models.JSONField(default=list)  # [1, 2, 3, 5, 7]
    
    def calculate_delivery_time(self, user_location):
        """
        Calculate estimated delivery days based on distance
        
        Formula:
        - 0-50km: 1 day
        - 50-100km: 1-2 days
        - 100-500km: 2-3 days
        - 500km+: 3-5 days
        """
        from django.contrib.gis.measure import Distance
        from django.contrib.gis.db.models.functions import Distance as DistanceFunc
        
        if not self.warehouse_location or not user_location:
            return 3  # Default
        
        # Calculate distance in km
        distance_km = self.warehouse_location.distance(user_location).km
        
        if distance_km <= 50:
            return 1
        elif distance_km <= 100:
            return 2
        elif distance_km <= 500:
            return 3
        else:
            return 5
    
    def get_available_delivery_options(self):
        """Get available delivery time slots"""
        if self.estimated_delivery_days:
            # Generate options from now to delivery
            min_days = max(1, self.estimated_delivery_days - 1)
            return list(range(min_days, self.estimated_delivery_days + 2))
        return [1, 2, 3, 5, 7]
    
    def save(self, *args, **kwargs):
        if not self.seller_location and self.seller:
            # Populate from seller profile
            if hasattr(self.seller, 'profile'):
                self.seller_location = self.seller.profile.location
        super().save(*args, **kwargs)


# File: your_app/views.py

class MarketplaceFilterView(APIView):
    def get(self, request):
        """Get products with delivery time filtering"""
        products = MarketplaceProduct.objects.all()
        
        # Get user location (from profile or query params)
        user_lat = request.query_params.get('latitude')
        user_lng = request.query_params.get('longitude')
        
        if user_lat and user_lng:
            from django.contrib.gis.geos import Point
            user_location = Point(float(user_lng), float(user_lat))
            
            # Delivery time filter
            delivery_days = request.query_params.get('delivery_days')
            if delivery_days:
                try:
                    delivery_days = int(delivery_days)
                    # Filter products deliverable within specified days
                    products = products.filter(
                        estimated_delivery_days__lte=delivery_days
                    )
                except ValueError:
                    pass
        
        return Response({
            'status': 'success',
            'count': products.count(),
            'results': MarketplaceProductSerializer(products, many=True).data
        })


# File: your_app/serializers.py

class MarketplaceProductSerializer(serializers.ModelSerializer):
    delivery_info = serializers.SerializerMethodField()
    
    def get_delivery_info(self, obj):
        """Include delivery information in response"""
        return {
            'estimated_days': obj.estimated_delivery_days,
            'available_options': obj.get_available_delivery_options(),
            'type': 'standard'  # or 'express', 'economy'
        }
```

#### Endpoint to Add
```python
# File: your_app/views.py

class DeliveryCalculatorView(APIView):
    """Calculate delivery time for a product to a location"""
    
    def post(self, request):
        """
        POST /api/v1/calculate-delivery/
        {
            "product_id": 123,
            "latitude": 27.7172,
            "longitude": 85.3240
        }
        """
        product_id = request.data.get('product_id')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        product = get_object_or_404(MarketplaceProduct, id=product_id)
        
        if latitude and longitude:
            from django.contrib.gis.geos import Point
            user_location = Point(float(longitude), float(latitude))
            days = product.calculate_delivery_time(user_location)
        else:
            days = product.estimated_delivery_days or 3
        
        return Response({
            'status': 'success',
            'estimated_delivery_days': days,
            'available_options': product.get_available_delivery_options(),
            'delivery_date': (
                datetime.now() + timedelta(days=days)
            ).strftime('%Y-%m-%d')
        })
```

---

## 🟡 MEDIUM PRIORITY (Enhancement)

### 7. Add Faceted Search
**Impact:** Better filtering UI  
**Severity:** MEDIUM  
**Effort:** 2-3 hours

```python
# File: your_app/views.py

class MarketplaceFacetsView(APIView):
    """Get filter options and counts for current search"""
    
    def get(self, request):
        """
        GET /api/v1/marketplace/facets/
        Returns available filter values with product counts
        """
        products = MarketplaceProduct.objects.all()
        
        # Apply existing filters
        search = request.query_params.get('search')
        if search:
            products = products.filter(
                Q(product_details__name__icontains=search) |
                Q(product_details__description__icontains=search)
            )
        
        # Get distinct values with counts
        from django.db.models import Count
        
        facets = {
            'colors': list(
                products.values('variants__color')
                .annotate(count=Count('id'))
                .filter(variants__color__isnull=False)
                .order_by('-count')
            ),
            'sizes': list(
                products.values('variants__size')
                .annotate(count=Count('id'))
                .filter(variants__size__isnull=False)
                .order_by('-count')
            ),
            'cities': list(
                products.values('seller__profile__city__name')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
            'price_ranges': [
                {'min': 0, 'max': 1000, 'count': products.filter(price__lt=1000).count()},
                {'min': 1000, 'max': 5000, 'count': products.filter(price__gte=1000, price__lt=5000).count()},
                {'min': 5000, 'max': 10000, 'count': products.filter(price__gte=5000, price__lt=10000).count()},
                {'min': 10000, 'max': None, 'count': products.filter(price__gte=10000).count()},
            ],
            'ratings': [
                {'stars': 5, 'count': products.filter(average_rating__gte=4.5).count()},
                {'stars': 4, 'count': products.filter(average_rating__gte=3.5, average_rating__lt=4.5).count()},
                {'stars': 3, 'count': products.filter(average_rating__gte=2.5, average_rating__lt=3.5).count()},
                {'stars': 2, 'count': products.filter(average_rating__gte=1.5, average_rating__lt=2.5).count()},
                {'stars': 1, 'count': products.filter(average_rating__lt=1.5).count()},
            ]
        }
        
        return Response({
            'status': 'success',
            'facets': facets
        })
```

---

## 🔵 TESTING & DEPLOYMENT

### Pre-deployment Checklist
```bash
# Run migrations
python manage.py migrate

# Normalize existing data
python manage.py normalize_colors
python manage.py populate_ratings

# Run tests
python manage.py test

# Check database integrity
python manage.py dbshell
SELECT COUNT(*) FROM marketplace_product;
SELECT COUNT(*) FROM product_variant;
```

### Monitoring
```python
# File: your_app/monitoring.py

from django.core.management.base import BaseCommand
import logging

logger = logging.getLogger('product_search')

def log_search_metrics(query, result_count, execution_time):
    """Log search performance metrics"""
    logger.info(
        f"Search: query={query}, results={result_count}, time={execution_time}ms"
    )

def log_filter_usage(filter_type, value, result_count):
    """Log filter usage for analytics"""
    logger.info(
        f"Filter: type={filter_type}, value={value}, results={result_count}"
    )
```

---

## Summary of Changes

| Item | File | Type | Lines | Status |
|------|------|------|-------|--------|
| City Filter Fix | views.py | Bug Fix | 20-30 | 🔴 CRITICAL |
| Rating Update | models.py, views.py | Feature | 80-100 | 🔴 CRITICAL |
| Color Normalization | models.py | Bug Fix | 60-80 | 🔴 CRITICAL |
| Search Relevance | views.py | Enhancement | 50-70 | 🟠 HIGH |
| Size Filter | models.py, views.py | Feature | 60-80 | 🟠 HIGH |
| Delivery Time | models.py, views.py | Feature | 50-70 | 🟠 HIGH |
| Faceted Search | views.py | Enhancement | 40-60 | 🟡 MEDIUM |

---

## Timeline Estimate

- **Week 1:** Critical fixes (City, Ratings, Colors)
- **Week 2:** High priority items (Search, Size, Delivery)
- **Week 3:** Polish, testing, deployment

---

## Support

For questions or clarification on any of these changes, refer back to the documentation or contact the frontend team.


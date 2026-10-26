from django.db import models

# Create your models here.
# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete`set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models

class Restaurant(models.Model):
    restaurant_id = models.IntegerField(db_column='Restaurant_ID', primary_key=True)  # Field name made lowercase.
    restaurant = models.TextField(db_column='Restaurant', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Restaurant'

class OrderMethod(models.Model):
    order_id = models.IntegerField(db_column='Order_ID', primary_key=True)  # Field name made lowercase.
    order_type = models.TextField(db_column='Order_Type', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Order_Method'

class Hour(models.Model):
    hour = models.IntegerField(db_column='Hour', primary_key=True)  # Field name made lowercase.
    hour_interval = models.TimeField(db_column='Hour_Interval', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Hour'

class Quarter(models.Model):
    quarter_id = models.IntegerField(db_column='Quarter_ID', primary_key=True)  # Field name made lowercase.
    quarter = models.TextField(db_column='Quarter', blank=True, null=True)  # Field name made lowercase. This field type is a guess.

    class Meta:
        managed = False
        db_table = 'Quarter'

class Combined_Orders(models.Model):
    period_id = models.IntegerField(db_column='Period_ID', primary_key=True)  # Field name made lowercase.
    restaurant = models.ForeignKey('Restaurant', models.DO_NOTHING, db_column='Restaurant_ID', blank=True, null=True)  # Field namemade lowercase.
    order_method = models.ForeignKey('OrderMethod', models.DO_NOTHING, db_column='Order_Method', blank=True, null=True)  # Field name made lowercase.
    date = models.DateField(db_column='Date', blank=True, null=True)  # Field name made lowercase.
    time_period_hour = models.ForeignKey(Hour, models.DO_NOTHING,db_column='Time_Period_Hour', blank=True, null=True)  # Field name made lowercase.
    time_period_quarter = models.ForeignKey('Quarter', models.DO_NOTHING, db_column='Time_Period_Quarter', blank=True, null=True)  # Field name made lowercase.
    number_of_orders = models.IntegerField(db_column='Number_Of_Orders', blank=True, null=True)  # Field name made lowercase.
    low_bump = models.DecimalField(db_column='Low_Bump', max_digits=6, decimal_places=2, blank=True, null=True)  # Field name made lowercase.
    high_bump = models.DecimalField(db_column='High_Bump', max_digits=6, decimal_places=2, blank=True, null=True)  # Field name made lowercase.
    avg_no_items = models.DecimalField(db_column='Avg_No_Items', max_digits=6, decimal_places=2, blank=True, null=True)  # Field name made lowercase.
    avg_bump_time = models.DecimalField(db_column='Avg_Bump_Time', max_digits=6, decimal_places=2, blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Kiosk_Orders'

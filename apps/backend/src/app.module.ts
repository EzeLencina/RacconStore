import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from '@modules/health/health.module';
import { CoreModule } from '@core/core.module';
import { BrandsModule } from '@modules/brands';
import { VariantsModule } from '@modules/variants';
import { InventoryModule } from '@modules/inventory';
import { OrdersModule } from '@modules/orders/orders.module';
import { CustomersModule } from '@modules/customers/customers.module';
import { WishlistsModule } from '@modules/wishlists/wishlists.module';
import { ReviewsModule } from '@modules/reviews/reviews.module';
import { ImportExportModule } from '@modules/import-export';
import appConfig from '@config/app.config';
import databaseConfig from '@config/database.config';
import redisConfig from '@config/redis.config';
import jwtConfig from '@config/jwt.config';
import storageConfig from '@config/storage.config';
import mailConfig from '@config/mail.config';
import queueConfig from '@config/queue.config';
import cacheConfig from '@config/cache.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        storageConfig,
        mailConfig,
        queueConfig,
        cacheConfig,
      ],
    }),
    CoreModule,
    HealthModule,
    BrandsModule,
    VariantsModule,
    InventoryModule,
    OrdersModule,
    CustomersModule,
    WishlistsModule,
    ReviewsModule,
    ImportExportModule,
  ],
})
export class AppModule {}

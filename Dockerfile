# 1️⃣ Base image
FROM php:8.2-fpm

# 2️⃣ Set working directory
WORKDIR /var/www/html

# 3️⃣ Install system packages & PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# 4️⃣ Copy the whole application (includes artisan)
COPY . .

# 5️⃣ Install Composer globally
RUN curl -sS https://getcomposer.org/installer | php -- \
    --install-dir=/usr/local/bin --filename=composer

# 6️⃣ Install PHP dependencies (no dev, optimized autoloader)
RUN composer install --no-dev --optimize-autoloader

# 7️⃣ Set PHP upload limits
RUN echo "upload_max_filesize = 100M" > /usr/local/etc/php/conf.d/upload_limits.ini && \
    echo "post_max_size = 100M" >> /usr/local/etc/php/conf.d/upload_limits.ini

# 8️⃣ Expose the PHP‑FPM port
EXPOSE 9000

# 9️⃣ Start PHP‑FPM
CMD ["php-fpm"]

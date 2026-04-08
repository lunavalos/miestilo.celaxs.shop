FROM php:8.2-fpm

# Set working directory
WORKDIR /var/www/html

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Copy composer files and install PHP dependencies
COPY composer.json composer.lock ./
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install --no-dev --optimize-autoloader

# Copy application source code
COPY . .

# Set PHP upload limits to 100M
RUN echo "upload_max_filesize = 100M" > /usr/local/etc/php/conf.d/upload_limits.ini && \
    echo "post_max_size = 100M" >> /usr/local/etc/php/conf.d/upload_limits.ini

# Expose PHP-FPM port
EXPOSE 9000

# Start PHP-FPM service
CMD ["php-fpm"]

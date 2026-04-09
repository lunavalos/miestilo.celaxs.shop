# 1️⃣ Build Frontend Assets
FROM node:20 AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2️⃣ Base image for PHP/Apache
FROM php:8.2-apache
WORKDIR /var/www/html

# Configure Apache DocumentRoot
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Enable Apache mod_rewrite for Laravel routing
RUN a2enmod rewrite

# Install system packages & PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy application files
COPY . .

# Copy compiled frontend assets from 'frontend' stage
COPY --from=frontend /app/public/build ./public/build

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install PHP dependencies (no dev, optimized autoloader)
RUN composer install --no-dev --optimize-autoloader

# Set permissions for Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# PHP config
RUN echo "upload_max_filesize = 100M" > /usr/local/etc/php/conf.d/upload_limits.ini && \
    echo "post_max_size = 100M" >> /usr/local/etc/php/conf.d/upload_limits.ini

EXPOSE 80

CMD chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && apache2-foreground


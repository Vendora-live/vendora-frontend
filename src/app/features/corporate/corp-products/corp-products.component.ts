import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { StoreService } from '../../../core/services/store.service';
import { CategoryService } from '../../../core/services/category.service';
import { Product, ProductImage, ProductRequest } from '../../../shared/models/product';
import { Category } from '../../../shared/models/category';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-corp-products',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './corp-products.component.html',
  styleUrl: './corp-products.component.css'
})
export class CorpProductsComponent implements OnInit {

  categories: Category[] = [];
  products: Product[] = [];

  selectedStoreId: number | null = null;
  isLoading = false;
  isSaving = false;

  productForm: FormGroup;
  showProductModal = false;
  editingProductId: number | null = null;

  // Image upload state
  existingImages: ProductImage[] = [];
  newFiles: File[] = [];
  newFilePreviews: string[] = [];

  // Pagination
  pageNumber = 0;
  pageSize = 20;
  totalPages = 0;

  constructor(
    private productService: ProductService,
    private storeService: StoreService,
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      sku: ['', Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      storeId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.categoryService.getAllCategories({ pageNumber: 0, pageSize: 100 }).subscribe({
      next: (res) => this.categories = res?.content || [],
      error: (err) => console.error('Could not load categories', err)
    });

    this.storeService.getMyStores({ pageNumber: 0, pageSize: 10 }).subscribe({
      next: (res) => {
        const stores = res?.content || [];
        if (stores.length > 0) {
          this.selectedStoreId = stores[0].id;
          this.productForm.patchValue({ storeId: this.selectedStoreId });
          this.loadProducts();
        }
      },
      error: (err) => console.error('Could not load store', err)
    });
  }

  loadProducts(): void {
    if (!this.selectedStoreId) return;
    this.isLoading = true;
    this.productService.getProductsByStoreId(this.selectedStoreId, { pageNumber: this.pageNumber, pageSize: this.pageSize }).subscribe({
      next: (res) => {
        this.products = res?.content || [];
        this.totalPages = Math.ceil((res?.totalElement || 0) / this.pageSize);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Could not load products', err);
        this.isLoading = false;
      }
    });
  }

  prevPage(): void { if (this.pageNumber > 0) { this.pageNumber--; this.loadProducts(); } }
  nextPage(): void { if (this.pageNumber < this.totalPages - 1) { this.pageNumber++; this.loadProducts(); } }
  goToPage(pageStr: string): void {
    const page = parseInt(pageStr, 10);
    if (!isNaN(page) && page > 0 && page <= this.totalPages) {
      this.pageNumber = page - 1;
      this.loadProducts();
    }
  }

  openProductModal(product?: Product): void {
    this.newFiles = [];
    this.newFilePreviews = [];

    if (product) {
      this.editingProductId = product.id;
      this.existingImages = [...(product.images || [])];
      const category = this.categories.find(c => c.name === product.categoryName);
      this.productForm.patchValue({
        name: product.name,
        description: product.description,
        sku: product.sku,
        unitPrice: product.unitPrice,
        stockQuantity: product.stockQuantity,
        categoryId: category ? category.id : null,
        storeId: product.storeId
      });
    } else {
      this.editingProductId = null;
      this.existingImages = [];
      this.productForm.reset({ storeId: this.selectedStoreId, unitPrice: 0, stockQuantity: 0 });
    }
    this.showProductModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.newFiles = [];
    this.newFilePreviews = [];
    this.existingImages = [];
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const maxSlots = 6 - this.existingImages.length - this.newFiles.length;
    const incoming = Array.from(input.files).slice(0, maxSlots);

    incoming.forEach(file => {
      this.newFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => this.newFilePreviews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeNewFile(index: number): void {
    this.newFiles.splice(index, 1);
    this.newFilePreviews.splice(index, 1);
  }

  deleteExistingImage(imageId: number): void {
    if (!this.editingProductId) return;
    this.productService.deleteProductImage(this.editingProductId, imageId).subscribe({
      next: () => {
        this.existingImages = this.existingImages.filter(i => i.id !== imageId);
        const product = this.products.find(p => p.id === this.editingProductId);
        if (product) product.images = this.existingImages;
      },
      error: (err) => console.error('Could not delete image', err)
    });
  }

  setExistingPrimary(imageId: number): void {
    if (!this.editingProductId) return;
    this.productService.setPrimaryImage(this.editingProductId, imageId).subscribe({
      next: (updated) => {
        this.existingImages = updated.images || [];
        const idx = this.products.findIndex(p => p.id === this.editingProductId);
        if (idx !== -1) this.products[idx] = updated;
      },
      error: (err) => console.error('Could not set primary image', err)
    });
  }

  get totalImageSlots(): number {
    return this.existingImages.length + this.newFiles.length;
  }

  saveProduct(): void {
    if (this.productForm.invalid) return;
    this.isSaving = true;

    const formValue = this.productForm.value;
    const request: ProductRequest = {
      name: formValue.name,
      description: formValue.description,
      sku: formValue.sku,
      unitPrice: formValue.unitPrice,
      stockQuantity: formValue.stockQuantity,
      categoryId: formValue.categoryId ? +formValue.categoryId : null,
      storeId: formValue.storeId ? +formValue.storeId : this.selectedStoreId!
    };

    if (this.editingProductId) {
      this.productService.updateProduct(this.editingProductId, request).subscribe({
        next: (updated) => {
          if (this.newFiles.length > 0) {
            this.productService.uploadProductImages(updated.id, this.newFiles).subscribe({
              next: (images) => {
                updated.images = images;
                updated.primaryImageUrl = images.find(i => i.isPrimary)?.imageUrl ?? images[0]?.imageUrl;
                this.updateProductInList(updated);
                this.isSaving = false;
                this.closeProductModal();
              },
              error: (err) => { console.error('Image upload failed', err); this.isSaving = false; }
            });
          } else {
            this.updateProductInList(updated);
            this.isSaving = false;
            this.closeProductModal();
          }
        },
        error: (err) => { console.error('Error updating product', err); this.isSaving = false; }
      });
    } else {
      this.productService.createProduct(request).subscribe({
        next: (created) => {
          if (this.newFiles.length > 0) {
            this.productService.uploadProductImages(created.id, this.newFiles).subscribe({
              next: (images) => {
                created.images = images;
                created.primaryImageUrl = images.find(i => i.isPrimary)?.imageUrl ?? images[0]?.imageUrl;
                this.products.unshift(created);
                this.isSaving = false;
                this.closeProductModal();
              },
              error: (err) => {
                console.error('Image upload failed', err);
                this.products.unshift(created);
                this.isSaving = false;
                this.closeProductModal();
              }
            });
          } else {
            this.products.unshift(created);
            this.isSaving = false;
            this.closeProductModal();
          }
        },
        error: (err) => { console.error('Error creating product', err); this.isSaving = false; }
      });
    }
  }

  private updateProductInList(updated: Product): void {
    const idx = this.products.findIndex(p => p.id === updated.id);
    if (idx !== -1) this.products[idx] = updated;
    else this.loadProducts();
  }

  deleteProduct(productId: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(productId).subscribe({
        next: () => this.products = this.products.filter(p => p.id !== productId),
        error: (err) => console.error('Error deleting product', err)
      });
    }
  }

  getImageUrl(url: string | null | undefined): string {
    return this.productService.getImageUrl(url);
  }

  getPrimaryImage(product: Product): string {
    return this.productService.getPrimaryImageUrl(product);
  }
}

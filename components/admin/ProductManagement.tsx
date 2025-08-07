
import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Card } from '../ui/Card';
import { ICONS } from '../../constants';
import { Product } from '../../types';
import { Modal } from '../ui/Modal';

export const ProductManagement: React.FC = () => {
    const { products, addProduct, updateProduct, deleteProduct, orders } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const initialFormState: Omit<Product, 'id' | 'reservedStock'> = { sku: '', name: '', price: 0, stock: 0, capacityUnit: 1 };
    const [currentProduct, setCurrentProduct] = useState<Omit<Product, 'id' | 'reservedStock'> | Product>(initialFormState);
    const [isEditing, setIsEditing] = useState(false);

    const openModalForAdd = () => {
        setIsEditing(false);
        setCurrentProduct(initialFormState);
        setIsModalOpen(true);
    };

    const openModalForEdit = (product: Product) => {
        setIsEditing(true);
        setCurrentProduct(product);
        setIsModalOpen(true);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentProduct(prev => ({ ...prev, [name]: (name === 'price' || name === 'stock') ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentProduct.name && currentProduct.sku && currentProduct.price > 0) {
            if (isEditing) {
                updateProduct(currentProduct as Product);
            } else {
                addProduct(currentProduct as Omit<Product, 'id' | 'reservedStock'>);
            }
            setIsModalOpen(false);
        }
    };

    const handleDelete = (productId: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            deleteProduct(productId);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-dark">Manajemen Produk</h1>
                <button
                    onClick={openModalForAdd}
                    className="flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-dark transition duration-300"
                >
                    {ICONS.plus}
                    Tambah Produk
                </button>
            </div>

            <Card className="!p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">SKU</th>
                                <th scope="col" className="px-6 py-3">Nama Produk</th>
                                <th scope="col" className="px-6 py-3">Harga</th>
                                <th scope="col" className="px-6 py-3">Stok</th>
                                <th scope="col" className="px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product: Product) => {
                                const hasDependencies = orders.some(o => o.items.some(i => i.productId === product.id));
                                return (
                                <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-gray-500">{product.sku}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4">Rp {product.price.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{product.stock - product.reservedStock}</span>
                                            <span className="text-xs text-gray-500">({product.stock} Total Fisik)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button onClick={() => openModalForEdit(product)} className="text-blue-600 hover:text-blue-800 p-1">{React.cloneElement(ICONS.edit, {width: 20, height: 20})}</button>
                                        <div className="relative group">
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                disabled={hasDependencies}
                                                className="text-red-600 hover:text-red-800 p-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            >
                                                {React.cloneElement(ICONS.trash, { width: 20, height: 20 })}
                                            </button>
                                            {hasDependencies && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    Tidak dapat dihapus karena terikat pada pesanan.
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal title={isEditing ? "Edit Produk" : "Tambah Produk Baru"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Produk</label>
                        <input type="text" name="name" id="name" value={currentProduct.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required />
                    </div>
                    <div>
                        <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU</label>
                        <input type="text" name="sku" id="sku" value={currentProduct.sku} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Harga (Rp)</label>
                            <input type="number" name="price" id="price" value={currentProduct.price} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required />
                        </div>
                        <div>
                            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stok Fisik Total</label>
                            <input type="number" name="stock" id="stock" value={currentProduct.stock} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required />
                        </div>
                    </div>
                    {isEditing && 'reservedStock' in currentProduct &&
                         <p className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded-md">Stok dipesan saat ini: {currentProduct.reservedStock}. Mengubah stok fisik tidak akan memengaruhi stok yang sudah dipesan.</p>
                    }
                    <div className="flex justify-end pt-4">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                        <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark">{isEditing ? "Simpan Perubahan" : "Tambah Produk"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

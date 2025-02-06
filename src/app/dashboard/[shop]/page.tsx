"use client"

import { useEffect, useState } from "react"
import { authenticatedApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";


export default function DashboardPage() {
    const { shop } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await authenticatedApi.get('/products');
                console.log('API Response:', response);
                setProducts(response.data.products);
                setIsLoading(false);
            } catch (err: any) {
                const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch products';
                setError(errorMessage);
                console.error('Dashboard error:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status
                });
            }
        };

        fetchProducts();
    }, []);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">{shop}</h1>
                    <p className="text-muted-foreground">Manage your store and products</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{products.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Active Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{products.filter((p: any) => p.status === 'active').length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Vendors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {new Set(products.map((p: any) => p.vendor)).size}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList>
                    <TabsTrigger value="all">All Products</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="draft">Draft</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product: any) => (
                            <Card key={product.id}>
                                <CardContent className="p-6">
                                    {product.image && (
                                        <img
                                            src={product.image.src}
                                            alt={product.title}
                                            className="w-full h-48 object-cover rounded-md mb-4"
                                        />
                                    )}
                                    <h2 className="text-lg font-semibold mb-2">{product.title}</h2>
                                    <p className="text-muted-foreground">{product.vendor}</p>
                                    <div className="mt-4 flex justify-between items-center">
                                        <span className="text-sm font-medium">
                                            ${product.variants?.[0]?.price || 'N/A'}
                                        </span>
                                        <Button variant="outline" size="sm">Edit</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}



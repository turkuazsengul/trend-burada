import React, {useRef, useState} from 'react';
import {useHistory} from 'react-router-dom';
import {Toast} from 'primereact/toast';
import {SellerLayout} from '../layout/SellerLayout';
import SellerProductService from '../service/SellerProductService';
import {SellerProductForm} from '../components/SellerProductForm';

const initialForm = {
    title: '',
    category: '',
    categoryPath: [],
    brand: '',
    productCode: '',
    imageUrl: '',
    price: '',
    oldPrice: '',
    discountRate: '',
    color: '',
    size: '',
    colorOptions: [],
    sizeOptions: [],
    installmentText: 'Pesin fiyatina',
    freeCargo: false,
    fastDelivery: false,
    highlightsText: '',
    attributesText: ''
};

export const SellerProductCreatePage = () => {
    const history = useHistory();
    const toastRef = useRef(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async ({form, isValid}) => {
        if (!isValid) {
            setErrorMessage('Zorunlu kart alanlarini ve temel detay bilgilerini tamamlayin.');
            return;
        }

        setSubmitting(true);
        setErrorMessage('');
        try {
            const created = await SellerProductService.createSellerProduct(form);
            if (toastRef.current) {
                toastRef.current.show({
                    severity: 'success',
                    summary: 'Urun kaydedildi',
                    detail: `${created?.title || 'Urun'} listeye eklendi.`,
                    life: 1800
                });
            }
            window.setTimeout(() => {
                history.push('/seller/products');
            }, 900);
        } catch (error) {
            setErrorMessage('Urun olusturulurken bir hata olustu. Backend responseu kontrol edilmeli.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Toast ref={toastRef} position="top-right"/>
            <SellerLayout title="Yeni urun" subtitle="Kart ve detay alanlarini ayni urun modeli uzerinden olustur.">
                <SellerProductForm
                    initialForm={initialForm}
                    errorMessage={errorMessage}
                    submitting={submitting}
                    submitLabel="Urunu olustur"
                    onCancel={() => history.push('/seller/products')}
                    onSubmit={handleSubmit}
                />
            </SellerLayout>
        </>
    );
};

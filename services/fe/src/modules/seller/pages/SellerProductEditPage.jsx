import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Button} from 'primereact/button';
import {Toast} from 'primereact/toast';
import {useHistory} from 'react-router-dom';
import {SellerLayout} from '../layout/SellerLayout';
import SellerProductService from '../service/SellerProductService';
import {SellerProductForm} from '../components/SellerProductForm';

export const SellerProductEditPage = ({match}) => {
    const history = useHistory();
    const toastRef = useRef(null);
    const productId = match?.params?.id;
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        SellerProductService.getSellerProductById(productId)
            .then((response) => {
                if (mounted) {
                    setProduct(response);
                }
            })
            .finally(() => {
                if (mounted) {
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [productId]);

    const initialForm = useMemo(() => SellerProductService.buildSellerProductForm(product), [product]);

    const handleSubmit = async ({form, isValid}) => {
        if (!isValid) {
            setErrorMessage('Zorunlu kart alanlarini ve temel detay bilgilerini tamamlayin.');
            return;
        }

        setSaving(true);
        setErrorMessage('');
        try {
            const updated = await SellerProductService.updateSellerProduct(productId, form);
            if (toastRef.current) {
                toastRef.current.show({
                severity: 'success',
                summary: 'Degisiklikler kaydedildi',
                detail: `${updated?.title || 'Urun'} guncellendi.`,
                life: 1800
                });
            }
            window.setTimeout(() => {
                history.push('/seller/products');
            }, 900);
        } catch (error) {
            setErrorMessage('Urun guncellenirken bir hata olustu.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!product) {
            return;
        }

        const approved = window.confirm(`${product.title || 'Bu urun'} kalici olarak silinsin mi?`);
        if (!approved) {
            return;
        }

        setDeleting(true);
        try {
            await SellerProductService.deleteSellerProduct(productId);
            if (toastRef.current) {
                toastRef.current.show({
                severity: 'success',
                summary: 'Urun silindi',
                detail: `${product.title || 'Urun'} listeden kaldirildi.`,
                life: 1800
                });
            }
            window.setTimeout(() => {
                history.push('/seller/products');
            }, 900);
        } catch (error) {
            setErrorMessage('Urun silinirken bir hata olustu.');
            setDeleting(false);
        }
    };

    return (
        <>
            <Toast ref={toastRef} position="top-right"/>
            <SellerLayout
                title="Urun duzenleme"
                subtitle="Secili urunun yayin bilgilerini guncelle ve listeye geri don."
                actions={<Button label="Sil" className="p-button-danger p-button-outlined" loading={deleting} onClick={handleDelete} disabled={!product || loading || saving}/>}
            >
                {loading ? <div className="seller-panel-card seller-empty-state">Urun yukleniyor...</div> : null}

                {!loading && !product ? (
                    <div className="seller-panel-card seller-empty-state">Bu seller'a ait urun bulunamadi.</div>
                ) : null}

                {!loading && product ? (
                    <SellerProductForm
                        initialForm={initialForm}
                        errorMessage={errorMessage}
                        submitting={saving}
                        submitLabel="Degisiklikleri kaydet"
                        submitIcon="pi pi-save"
                        submitDisabled={deleting}
                        onCancel={() => history.push('/seller/products')}
                        onSubmit={handleSubmit}
                    />
                ) : null}
            </SellerLayout>
        </>
    );
};

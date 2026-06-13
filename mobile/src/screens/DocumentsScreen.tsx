import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import uuid from 'react-native-uuid';
import { supabase } from '../lib/supabase';
import { validateUpload, buildStoragePath } from '../lib/uploadValidation';
import type { Session } from '@supabase/supabase-js';

const DOC_TYPES = ['other', 'rental_contract', 'loan_agreement', 'invoice', 'insurance', 'utility_bill', 'permit', 'purchase_deed'];

type Doc = { id: string; filename: string; doc_type: string | null; created_at: string };

type Props = { session: Session };

export default function DocumentsScreen({ session }: Props) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('other');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [properties, setProperties] = useState<{ id: string; address: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    const { data, error: fetchError } = await supabase.from('documents')
      .select('id, filename, doc_type, created_at')
      .order('created_at', { ascending: false }).limit(20);
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setDocs((data ?? []) as Doc[]);
  }, []);

  const fetchProperties = useCallback(async () => {
    const { data } = await supabase.from('properties').select('id, address').order('created_at');
    setProperties((data ?? []) as { id: string; address: string }[]);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDocs(), fetchProperties()]).finally(() => setLoading(false));
  }, [fetchDocs, fetchProperties]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDocs();
    setRefreshing(false);
  }, [fetchDocs]);

  async function uploadFile(uri: string, filename: string, mimeType: string) {
    const validationError = validateUpload(selectedProperty, filename);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fileId = String(uuid.v4());
      const storagePath = buildStoragePath(
        session.user.id,
        'property',
        selectedProperty as string,
        fileId,
        filename
      );

      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: mimeType } as unknown as Blob);

      const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, formData);
      if (uploadError) { setError(uploadError.message); return; }

      const { error: dbError } = await supabase.from('documents').insert({
        owner_id: session.user.id,
        entity_type: 'property',
        entity_id: selectedProperty,
        doc_type: selectedDocType,
        filename,
        storage_path: storagePath,
      });
      if (dbError) {
        await supabase.storage.from('documents').remove([storagePath]);
        setError(dbError.message);
        return;
      }

      setShowUploadModal(false);
      await fetchDocs();
    } finally {
      setUploading(false);
    }
  }

  async function handleCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission required', 'Camera permission is needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.fileName ?? `photo_${Date.now()}.jpg`;
      await uploadFile(asset.uri, filename, asset.type ?? 'image/jpeg');
    }
  }

  async function handleGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission required', 'Media library permission is needed.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.All });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.fileName ?? `image_${Date.now()}.jpg`;
      await uploadFile(asset.uri, filename, asset.type ?? 'image/jpeg');
    }
  }

  async function handleFilePicker() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, asset.name, asset.mimeType ?? 'application/octet-stream');
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">Documents</Text>

          {loading ? <ActivityIndicator /> : docs.length === 0 ? (
            <Text className="text-sm text-gray-500">No documents yet. Tap + to upload.</Text>
          ) : (
            <View className="space-y-2">
              {docs.map(doc => (
                <View key={doc.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                  <Text className="font-medium text-gray-900 text-sm">{doc.filename}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {doc.doc_type?.replace(/_/g, ' ') ?? 'other'} · {doc.created_at.split('T')[0]}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowUploadModal(true)}
        className="absolute bottom-6 right-6 bg-blue-600 rounded-full w-14 h-14 items-center justify-center shadow-lg"
      >
        <Text className="text-white text-2xl font-light">+</Text>
      </TouchableOpacity>

      {/* Upload modal */}
      {showUploadModal && (
        <View className="absolute inset-0 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Upload Document</Text>

            {error && <Text className="text-sm text-red-600 mb-3">{error}</Text>}

            {/* Property selector */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Property *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              {properties.map(p => (
                <TouchableOpacity key={p.id} onPress={() => setSelectedProperty(p.id)}
                  className={`mr-2 px-3 py-1.5 rounded-full border text-xs ${selectedProperty === p.id ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                  <Text className={selectedProperty === p.id ? 'text-white text-xs' : 'text-gray-700 text-xs'}>{p.address}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Doc type selector */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Document Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {DOC_TYPES.map(t => (
                <TouchableOpacity key={t} onPress={() => setSelectedDocType(t)}
                  className={`mr-2 px-3 py-1.5 rounded-full border ${selectedDocType === t ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                  <Text className={`${selectedDocType === t ? 'text-white' : 'text-gray-700'} text-xs capitalize`}>{t.replace(/_/g, ' ')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {uploading ? <ActivityIndicator className="my-4" /> : (
              <View className="space-y-2">
                <TouchableOpacity onPress={handleCamera} className="bg-blue-600 rounded-xl p-3 items-center">
                  <Text className="text-white font-medium">Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleGallery} className="bg-blue-50 border border-blue-200 rounded-xl p-3 items-center">
                  <Text className="text-blue-700 font-medium">Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleFilePicker} className="bg-gray-50 border border-gray-200 rounded-xl p-3 items-center">
                  <Text className="text-gray-700 font-medium">File (PDF)</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowUploadModal(false); setError(null); }} className="p-3 items-center">
                  <Text className="text-gray-500">Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

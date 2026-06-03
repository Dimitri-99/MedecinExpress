import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

const { width } = Dimensions.get('window');

const DEV_SERVER_HOST = Constants.expoConfig?.hostUri?.split(':')[0] ?? '192.168.1.102';
const API_BASE_URL = `http://${DEV_SERVER_HOST}/medecinexpress_api`;
const REGISTER_URL = `${API_BASE_URL}/register.php`;
const LOGIN_URL = `${API_BASE_URL}/login.php`;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const STRUCTURES = [
  { id: '1', nom: 'Dr. Christian Kamga', type: 'Médecin', specialite: 'Médecin généraliste', distance: '1.2 km', adresse: 'Rue de l\'Hôpital', dispo: 'Disponible immédiatement', latitude: 3.858, longitude: 11.502 },
  { id: '2', nom: 'Dr. Sarah Ngo', type: 'Médecin', specialite: 'Pédiatre', distance: '2.7 km', adresse: 'Avenue de l\'Indépendance', dispo: 'Prochain RDV : 14:30', latitude: 3.862, longitude: 11.515 },
  { id: '3', nom: 'Dr. Alain Mballa', type: 'Médecin', specialite: 'Cardiologue', distance: '4.1 km', adresse: 'Boulevard de la Liberté', dispo: 'Disponible demain', latitude: 3.852, longitude: 11.498 },
  { id: '4', nom: 'Dr. Mireille Essono', type: 'Médecin', specialite: 'Dermatologue', distance: '5.6 km', adresse: 'Quartier Résidentiel', dispo: 'Créneau libre : 16:00', latitude: 3.865, longitude: 11.508 },
  { id: '5', nom: 'Dr. Jean Tchakounté', type: 'Médecin', specialite: 'Dentiste', distance: '0.5 km', adresse: 'Centre Commercial', dispo: 'Disponible immédiatement', latitude: 3.855, longitude: 11.501 },
  { id: '6', nom: 'Pharmacie du Centre', type: 'Pharmacie', specialite: 'Officine principale', distance: '0.8 km', adresse: 'Place Centrale', ouverte: true, latitude: 3.859, longitude: 11.503 },
  { id: '7', nom: 'Pharmacie Espoir Santé', type: 'Pharmacie', specialite: 'Garde H24', distance: '1.9 km', adresse: 'Face Clinique de l\'Espoir', ouverte: true, latitude: 3.861, longitude: 11.495 },
  { id: '8', nom: 'Pharmacie de l’Étoile', type: 'Pharmacie', specialite: 'Garde standard', distance: '3.4 km', adresse: 'Marché Nord', ouverte: false, latitude: 3.848, longitude: 11.512 },
  { id: '9', nom: 'Pharmacie Urgence Plus', type: 'Pharmacie', specialite: 'Garde de nuit', distance: '4.8 km', adresse: 'Avenue des Chemins de Fer', ouverte: true, latitude: 3.869, longitude: 11.504 },
  { id: '10', nom: 'Clinique de la Paix', type: 'Médecin', specialite: 'Urgences & Polyclinique', distance: '2.1 km', adresse: 'Rond-point de la Paix', dispo: 'Urgences ouvertes 24/7', latitude: 3.853, longitude: 11.510 },
];

type AppTab = 'home' | 'triage' | 'map' | 'notifications' | 'profil';
type ScreenState = 'welcome' | 'login' | 'register' | AppTab;

type UserProfile = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  contact_urgence: string;
  groupe_sanguin: string;
  dossier_medical: string;
  uri_fichier_doc?: string;
  nom_fichier_doc?: string;
};

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStructures, setFilteredStructures] = useState(STRUCTURES);

  const [selectedSymptom, setSelectedSymptom] = useState('Fièvre');
  const [intensity, setIntensity] = useState(5);
  const [triageStep, setTriageStep] = useState<'input' | 'result'>('input');
  const [triageRecommendation, setTriageRecommendation] = useState<{msg: string, isGrave: boolean, structure: typeof STRUCTURES[0] | null}>({ msg: '', isGrave: false, structure: null });

  const [bookingStructure, setBookingStructure] = useState<typeof STRUCTURES[0] | null>(null);
  const [bookingDate, setBookingDate] = useState('2026-06-04');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [reservations, setReservations] = useState([
    { id: 'r1', titre: 'Validation d\'urgence', description: 'Votre dossier médical de secours est synchronisé avec le réseau MédecinExpress.', date: 'Aujourd\'hui' },
  ]);

  const [registerData, setRegisterData] = useState({
    email: '', password: '', prenom: '', nom: '', date_naissance: '', telephone: '', contact_urgence: '', groupe_sanguin: 'O+', dossier_medical: '', uri_fichier_doc: '', nom_fichier_doc: ''
  });
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('saved_user_email');
        if (savedEmail) setLoginData(prev => ({ ...prev, email: savedEmail }));
      } catch (e) {
        console.error(e);
      }
    };
    loadSavedEmail();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredStructures(STRUCTURES);
    } else {
      const filtered = STRUCTURES.filter(st => 
        st.nom.toLowerCase().includes(text.toLowerCase()) || 
        st.specialite.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredStructures(filtered);
    }
  };

  const pickMedicalDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setRegisterData(prev => ({ ...prev, nom_fichier_doc: file.name, uri_fichier_doc: file.uri }));
        Alert.alert('Fichier importé', `${file.name} est prêt.`);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger le fichier.');
    }
  };

  const openSharedDocument = async () => {
    if (!user?.uri_fichier_doc) {
      Alert.alert('Fichier introuvable', 'Aucun document numérique valide n\'a été lié.');
      return;
    }
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(user.uri_fichier_doc);
      } else {
        Alert.alert('Erreur', 'Le partage et la lecture de fichiers ne sont pas disponibles sur ce système.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le fichier sauvegardé.');
    }
  };

  const handleLogin = async () => {
    if (!loginData.email.trim() || !loginData.password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const result = await response.json();
      if (result.status === 'success' && result.user) {
        await AsyncStorage.setItem('saved_user_email', loginData.email);
        setUser({
          prenom: result.user.prenom || 'Patient',
          nom: result.user.nom || '',
          email: result.user.email || loginData.email,
          telephone: result.user.telephone || registerData.telephone || '+237 600 000 000',
          contact_urgence: result.user.contact_urgence || registerData.contact_urgence || 'N/A',
          groupe_sanguin: result.user.groupe_sanguin || result.user.groupe_sanguin || 'O+',
          dossier_medical: result.user.dossier_medical || 'Aucun antécédent particulier déclaré.',
          nom_fichier_doc: registerData.nom_fichier_doc || 'Aucun fichier lié.',
          uri_fichier_doc: registerData.uri_fichier_doc || ''
        });
        setScreen('home');
        setActiveTab('home');
      } else {
        Alert.alert('Erreur', result.message || 'Identifiants incorrects');
      }
    } catch (error) {
      Alert.alert('Erreur Réseau', 'Vérifiez votre serveur API WAMP.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.email.trim() || !registerData.password.trim() || !registerData.prenom.trim() || !registerData.telephone.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir les informations obligatoires (*) ');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      const result = await response.json();
      if (result.status === 'success') {
        Alert.alert('Succès 🎉', 'Votre compte clinique MédecinExpress a bien été créé.');
        // Correction de sauvegarde immédiate des numéros saisis localement
        setLoginData(prev => ({ ...prev, email: registerData.email }));
        setScreen('login');
      } else {
        Alert.alert('Erreur', result.message || 'Erreur d\'insertion');
      }
    } catch (error) {
      Alert.alert('Erreur Réseau', 'Vérifiez l\'état de votre serveur WAMP.');
    } finally {
      setLoading(false);
    }
  };

  const executerTriageIA = () => {
    setLoading(true);
    setTimeout(() => {
      const isGrave = intensity >= 7;
      let recomMsg = "";
      let targetStructure = STRUCTURES[0];

      if (isGrave) {
        recomMsg = `⚠️ ALERTE GRAVITÉ (${intensity}/10) : Vos symptômes de [${selectedSymptom}] nécessitent une prise en charge rapide. Nous vous orientons immédiatement vers notre clinique d'urgence partenaire la plus proche.`;
        targetStructure = STRUCTURES[9];
      } else {
        recomMsg = `ℹ️ DIAGNOSTIC MODÉRÉ (${intensity}/10) : Vos symptômes de [${selectedSymptom}] ne présentent pas de signe de danger immédiat. Un suivi en cabinet de médecine générale ou un passage en pharmacie est amplement suffisant.`;
        targetStructure = STRUCTURES[0];
      }

      setTriageRecommendation({ msg: recomMsg, isGrave, structure: targetStructure });
      setTriageStep('result');
      setLoading(false);
    }, 1000);
  };

  const confirmerReservation = () => {
    if (!bookingStructure) return;
    const newRes = {
      id: String(Date.now()),
      titre: `📅 RDV Confirmé - ${bookingStructure.nom}`,
      description: `Consultation planifiée le ${bookingDate} à ${bookingTime}. Lieu : ${bookingStructure.adresse}.`,
      date: 'À l\'instant'
    };
    setReservations(prev => [newRes, ...prev]);
    Alert.alert('Réservation Réussie !', `Votre place a été bloquée pour le ${bookingDate} à ${bookingTime}.`);
    setBookingStructure(null);
    setActiveTab('notifications');
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    Alert.alert('Profil Mis à jour', 'Vos modifications ont été synchronisées localement.');
  };

  const renderTabContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'home':
        return (
          <ScrollView contentContainerStyle={styles.tabScrollContent}>
            <TouchableOpacity style={styles.emergencyButton} onPress={() => Alert.alert('🚨 Appel d\'Urgence', 'Mise en relation avec le SAMU/112...', [{text:'Annuler'}, {text:'Appeler', onPress:()=>Linking.openURL('tel:112')}])}>
              <Text style={styles.emergencyText}>🚨 DECLENCHER UN APPEL D'URGENCE</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Analyse Biométrique Réseau</Text>
            <View style={styles.vitalsRow}>
              <View style={styles.vitalCard}><Text style={styles.vitalEmoji}>❤️</Text><Text style={styles.vitalValue}>76 bpm</Text><Text style={styles.vitalLabel}>Rythme Cardiaque</Text></View>
              <View style={styles.vitalCard}><Text style={styles.vitalEmoji}>🏃‍♂️</Text><Text style={styles.vitalValue}>6 120</Text><Text style={styles.vitalLabel}>Compteur de pas</Text></View>
              <View style={styles.vitalCard}><Text style={styles.vitalEmoji}>🩸</Text><Text style={[styles.vitalValue, {color: '#dc2626'}]}>{user.groupe_sanguin}</Text><Text style={styles.vitalLabel}>Groupe Sanguin</Text></View>
            </View>

            <Text style={styles.sectionTitle}>Flux de Conseils Préventifs</Text>
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>💡 Conseils : Surveillance Hydrique</Text>
              <Text style={styles.tipsText}>Au vu de votre activité physique de 6 120 pas, nous vous recommandons d'absorber 500ml d'eau minérale dans la prochaine heure.</Text>
            </View>
          </ScrollView>
        );

      case 'triage':
        return (
          <ScrollView contentContainerStyle={styles.tabScrollContent}>
            <Text style={styles.screenTitle}>🤖 Triage IA Intelligent</Text>
            <Text style={styles.screenDescription}>Sélectionnez un symptôme et son intensité pour recevoir une orientation clinique automatique.</Text>
            
            {triageStep === 'input' ? (
              <View style={styles.cardLayout}>
                <Text style={styles.inputLabel}>Quel est votre symptôme majeur ?</Text>
                <View style={styles.symptomRow}>
                  {['Fièvre', 'Douleurs', 'Toux', 'Fatigue'].map(smp => (
                    <TouchableOpacity key={smp} style={[styles.symptomSelector, selectedSymptom === smp && styles.symptomSelectorActive]} onPress={() => setSelectedSymptom(smp)}>
                      <Text style={selectedSymptom === smp ? styles.symptomTextActive : styles.symptomText}>{smp}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, {marginTop: 20}]}>Niveau d'intensité ressenti : {intensity} / 10</Text>
                <View style={styles.intensityRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <TouchableOpacity key={num} style={[styles.intensityBox, intensity === num && styles.intensityBoxActive, num >= 7 && {borderColor: '#ef4444'}]} onPress={() => setIntensity(num)}>
                      <Text style={intensity === num ? styles.symptomTextActive : {fontSize: 12, fontWeight:'700'}}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.primaryButtonAction} onPress={executerTriageIA}>
                  <Text style={styles.primaryButtonText}>Analyser le niveau de danger</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.cardLayout, triageRecommendation.isGrave && {borderColor: '#ef4444', borderWidth: 1}]}>
                <Text style={[styles.tipsTitle, {color: triageRecommendation.isGrave ? '#dc2626' : '#1e3a8a', fontSize: 16}]}>Rapport d'Analyse IA</Text>
                <Text style={{color: '#334155', marginTop: 10, lineHeight: 22}}>{triageRecommendation.msg}</Text>
                
                {triageRecommendation.structure && (
                  <View style={styles.recommendationBox}>
                    <Text style={{fontWeight: '800'}}>Établissement recommandé :</Text>
                    <Text style={{fontWeight: '700', color:'#1e3a8a', marginTop: 2}}>{triageRecommendation.structure.nom}</Text>
                    <TouchableOpacity style={[styles.primaryButtonAction, {backgroundColor: '#10b981', marginTop: 12}]} onPress={() => { setBookingStructure(triageRecommendation.structure); setTriageStep('input'); setActiveTab('map'); }}>
                      <Text style={styles.primaryButtonText}>Prendre RDV en 1 clic</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity style={[styles.secondaryButtonAction, {marginTop: 10}]} onPress={() => setTriageStep('input')}>
                  <Text style={styles.secondaryButtonText}>Faire un nouveau triage</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        );

      case 'map':
        return (
          <View style={styles.mapContainer}>
            <View style={styles.searchBarWrapper}>
              <TextInput
                style={styles.mapSearchInput}
                placeholder="🔍 Rechercher un médecin, une pharmacie..."
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            <MapView 
              style={styles.actualMap} 
              showsUserLocation={true} // Affiche le point bleu GPS de l'utilisateur en direct
              initialRegion={{
                latitude: 3.858,
                longitude: 11.505,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
            >
              {filteredStructures.map((st) => (
                <Marker
                  key={st.id}
                  coordinate={{ latitude: st.latitude, longitude: st.longitude }}
                  pinColor={st.type === 'Médecin' ? '#1e3a8a' : '#10b981'}
                >
                  <Callout tooltip onPress={() => setBookingStructure(st)}>
                    <View style={styles.mapCallout}>
                      <Text style={styles.calloutTitle}>{st.nom}</Text>
                      <Text style={styles.calloutDesc}>{st.specialite}</Text>
                      <Text style={styles.calloutDist}>📍 {st.adresse}</Text>
                      <View style={styles.calloutBtn}><Text style={styles.calloutBtnText}>Réserver</Text></View>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>

            {bookingStructure && (
              <View style={styles.mapFormOverlay}>
                <Text style={styles.tipsTitle}>📆 Réservation : {bookingStructure.nom}</Text>
                <TextInput style={styles.input} value={bookingDate} onChangeText={setBookingDate} placeholder="AAAA-MM-JJ" />
                <TextInput style={styles.input} value={bookingTime} onChangeText={setBookingTime} placeholder="HH:MM" />
                <View style={{flexDirection: 'row', gap: 8, marginTop: 10}}>
                  <TouchableOpacity style={[styles.primaryButtonAction, {flex: 1, marginTop: 0}]} onPress={confirmerReservation}><Text style={styles.primaryButtonText}>Valider</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.secondaryButtonAction, {flex: 1}]} onPress={() => setBookingStructure(null)}><Text style={styles.secondaryButtonText}>Annuler</Text></TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );

      case 'notifications':
        return (
          <ScrollView contentContainerStyle={styles.tabScrollContent}>
            <Text style={styles.screenTitle}>🔔 Historique des validations</Text>
            {reservations.map(res => (
              <View key={res.id} style={styles.serviceCard}>
                <View style={styles.serviceCardHeader}><Text style={{fontWeight: '800', color: '#1e3a8a'}}>{res.titre}</Text><Text style={{fontSize: 12, color: '#64748b'}}>{res.date}</Text></View>
                <Text style={{color: '#334155', marginTop: 6, fontSize: 13}}>{res.description}</Text>
              </View>
            ))}
          </ScrollView>
        );

      case 'profil':
        return (
          <ScrollView contentContainerStyle={styles.tabScrollContent}>
            <View style={styles.profileHeaderCard}>
              <View style={styles.avatarPlaceholder}><Text style={{fontSize: 32}}>👤</Text></View>
              <Text style={styles.profileTitleText}>{user.prenom} {user.nom}</Text>
              <Text style={styles.profileSubText}>{user.email}</Text>
            </View>

            <Text style={styles.sectionTitle}>Dossier Clinique d'Urgence</Text>
            <View style={styles.cardLayout}>
              {isEditing ? (
                <View>
                  <Text style={styles.inputLabel}>Numéro de téléphone</Text>
                  <TextInput style={styles.input} value={user.telephone} onChangeText={t => setUser(p => p ? ({...p, telephone: t}) : null)} />
                  <Text style={styles.inputLabel}>Contact Secours</Text>
                  <TextInput style={styles.input} value={user.contact_urgence} onChangeText={t => setUser(p => p ? ({...p, contact_urgence: t}) : null)} />
                  <Text style={styles.inputLabel}>Antécédents / Allergies</Text>
                  <TextInput style={[styles.input, styles.inputMultiline]} value={user.dossier_medical} onChangeText={t => setUser(p => p ? ({...p, dossier_medical: t}) : null)} multiline />
                  <TouchableOpacity style={[styles.primaryButtonAction, {backgroundColor: '#10b981'}]} onPress={handleSaveProfile}><Text style={styles.primaryButtonText}>Enregistrer</Text></TouchableOpacity>
                </View>
              ) : (
                <View style={styles.gridContainer}>
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Téléphone :</Text><Text style={styles.infoValue}>{user.telephone}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Secours :</Text><Text style={[styles.infoValue, {color: '#dc2626', fontWeight: '800'}]}>{user.contact_urgence}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Groupe Sanguin :</Text><Text style={[styles.infoValue, {color: '#dc2626', fontWeight: '800'}]}>🩸 {user.groupe_sanguin}</Text></View>
                  <View style={[styles.infoRow, {flexDirection: 'column', alignItems: 'flex-start'}]}><Text style={styles.infoLabel}>Fiche Clinique :</Text><Text style={[styles.infoValue, {marginTop: 4}]}>{user.dossier_medical}</Text></View>
                  
                  {/* ZONE CLIQUABLE DU DOCUMENT IMPORTÉ */}
                  <View style={styles.documentViewerBox}>
                    <Text style={styles.infoLabel}>Fichier Numérique Rattaché :</Text>
                    <Text style={styles.documentFileName}>{user.nom_fichier_doc || "Aucun document importé."}</Text>
                    {user.uri_fichier_doc ? (
                      <TouchableOpacity style={styles.viewDocButton} onPress={openSharedDocument}>
                        <Text style={styles.viewDocButtonText}>👁️ Ouvrir / Visualiser le fichier</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={() => { setUser(null); setScreen('welcome'); }}><Text style={styles.logoutButtonText}>Déconnexion de la session</Text></TouchableOpacity>
          </ScrollView>
        );
    }
  };

  return (
    <View style={styles.globalContainer}>
      {/* Configuration barres systèmes transparente et immersive */}
      <StatusBar style="light" translucent={true} backgroundColor="transparent" />
      
      {/* BANNIÈRE DE RECOUVREMENT INTÉGRALE EN HAUT */}
      {user && screen !== 'welcome' && screen !== 'login' && screen !== 'register' && (
        <View style={styles.premiumHeader}>
          <View style={styles.headerTopLine}>
            <Text style={styles.headerAppTitle}>💙 MédecinExpress</Text>
            {activeTab === 'profil' && (
              <TouchableOpacity style={styles.settingsBadge} onPress={() => setIsEditing(!isEditing)}>
                <Text style={{fontSize: 13, fontWeight: '700', color: '#1e3a8a'}}>{isEditing ? '💾 OK' : '⚙️ Options'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.headerGreetingText}>Espace connecté — Suivi Clinique Actif</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {screen === 'welcome' && (
          <ScrollView contentContainerStyle={styles.welcomeContainer}>
            <View style={styles.heroCard}>
              <Text style={styles.heroBadge}>💙 MédecinExpress</Text>
              <Text style={styles.heroTitle}>Votre santé en ligne, simplement.</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.welcomeScreenButton} onPress={() => setScreen('login')}>
                <Text style={styles.welcomeButtonTextBlue}>Se connecter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.welcomeScreenButton, { backgroundColor: '#1e3a8a' }]} onPress={() => setScreen('register')}>
                <Text style={styles.welcomeButtonTextWhite}>S'inscrire</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {screen === 'login' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.authContent}>
              <TouchableOpacity style={styles.backButtonInline} onPress={() => setScreen('welcome')}>
                <Text style={styles.backButtonText}>← Retour à l'accueil</Text>
              </TouchableOpacity>
              <Text style={styles.screenTitle}>Connexion</Text>
              <View style={styles.inputBlock}><Text style={styles.inputLabel}>Adresse Email</Text><TextInput style={styles.input} placeholder="exemple@email.com" value={loginData.email} onChangeText={t => setLoginData(p=>({...p, email:t}))} keyboardType="email-address" autoCapitalize="none" /></View>
              <View style={styles.inputBlock}><Text style={styles.inputLabel}>Mot de passe</Text><TextInput style={styles.input} placeholder="••••••••" value={loginData.password} onChangeText={t => setLoginData(p=>({...p, password:t}))} secureTextEntry /></View>
              <TouchableOpacity style={styles.primaryButtonAction} onPress={handleLogin}><Text style={styles.primaryButtonText}>Se connecter</Text></TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {screen === 'register' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.authContent}>
              <TouchableOpacity style={styles.backButtonInline} onPress={() => setScreen('welcome')}>
                <Text style={styles.backButtonText}>← Retour à l'accueil</Text>
              </TouchableOpacity>
              <Text style={styles.screenTitle}>Création de dossier</Text>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputBlock, { flex: 1, marginRight: 8 }]}><Text style={styles.inputLabel}>Prénom *</Text><TextInput style={styles.input} placeholder="Jean" value={registerData.prenom} onChangeText={t => setRegisterData(p=>({...p, prenom:t}))} /></View>
                <View style={[styles.inputBlock, { flex: 1 }]}><Text style={styles.inputLabel}>Nom *</Text><TextInput style={styles.input} placeholder="Dupont" value={registerData.nom} onChangeText={t => setRegisterData(p=>({...p, nom:t}))} /></View>
              </View>
              
              <View style={styles.inputBlock}><Text style={styles.inputLabel}>Email de sécurité *</Text><TextInput style={styles.input} placeholder="email@test.com" value={registerData.email} onChangeText={t => setRegisterData(p=>({...p, email:t}))} keyboardType="email-address" autoCapitalize="none" /></View>
              <View style={styles.inputBlock}><Text style={styles.inputLabel}>Mot de passe *</Text><TextInput style={styles.input} placeholder="••••••••" value={registerData.password} onChangeText={t => setRegisterData(p=>({...p, password:t}))} secureTextEntry /></View>
              <View style={styles.inputBlock}><Text style={styles.inputLabel}>Date de naissance *</Text><TextInput style={styles.input} placeholder="1998-05-14" value={registerData.date_naissance} onChangeText={t => setRegisterData(p=>({...p, date_naissance:t}))} /></View>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputBlock, { flex: 1, marginRight: 8 }]}><Text style={styles.inputLabel}>Téléphone *</Text><TextInput style={styles.input} placeholder="+237..." value={registerData.telephone} onChangeText={t => setRegisterData(p=>({...p, telephone:t}))} keyboardType="phone-pad" /></View>
                <View style={[styles.inputBlock, { flex: 1 }]}><Text style={styles.inputLabel}>N° d'urgence proche *</Text><TextInput style={styles.input} placeholder="Nom - Téléphone" value={registerData.contact_urgence} onChangeText={t => setRegisterData(p=>({...p, contact_urgence:t}))} /></View>
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Groupe Sanguin *</Text>
                <View style={styles.bloodGroupGrid}>
                  {BLOOD_GROUPS.map(g => (
                    <TouchableOpacity key={g} style={[styles.bloodGroupBadge, registerData.groupe_sanguin === g && styles.bloodGroupBadgeSelected]} onPress={() => setRegisterData(p=>({...p, groupe_sanguin:g}))}><Text style={[styles.bloodGroupText, registerData.groupe_sanguin === g && styles.bloodGroupTextSelected]}>{g}</Text></TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Dossier médical numérique</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={pickMedicalDocument}>
                  <Text style={styles.pickerButtonText}>📂 Choisir un fichier</Text>
                </TouchableOpacity>
                {registerData.nom_fichier_doc !== '' && (
                  <Text style={styles.fileSelectedIndicator}>Chargé : {registerData.nom_fichier_doc}</Text>
                )}
              </View>

              <View style={styles.inputBlock}><Text style={styles.inputLabel}>Antécédents textuels</Text><TextInput style={[styles.input, styles.inputMultiline]} placeholder="Allergies..." value={registerData.dossier_medical} onChangeText={t => setRegisterData(p=>({...p, dossier_medical:t}))} multiline /></View>
              <TouchableOpacity style={styles.primaryButtonAction} onPress={handleRegister}><Text style={styles.primaryButtonText}>Valider l'inscription</Text></TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {user && screen !== 'welcome' && screen !== 'login' && screen !== 'register' && renderTabContent()}
      </View>

      {user && screen !== 'welcome' && screen !== 'login' && screen !== 'register' && (
        <View style={styles.customTabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}><Text style={{fontSize: 18}}>🏠</Text><Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Accueil</Text></TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('triage')}><Text style={{fontSize: 18}}>🤖</Text><Text style={[styles.tabLabel, activeTab === 'triage' && styles.tabLabelActive]}>Triage</Text></TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('map')}><Text style={{fontSize: 18}}>📍</Text><Text style={[styles.tabLabel, activeTab === 'map' && styles.tabLabelActive]}>Carte</Text></TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('notifications')}><Text style={{fontSize: 18}}>🔔</Text><Text style={[styles.tabLabel, activeTab === 'notifications' && styles.tabLabelActive]}>Alertes</Text></TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profil')}><Text style={{fontSize: 18}}>👤</Text><Text style={[styles.tabLabel, activeTab === 'profil' && styles.tabLabelActive]}>Profil</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  globalContainer: { flex: 1, backgroundColor: '#f0f9ff' },
  premiumHeader: { 
    backgroundColor: '#1e3a8a', 
    paddingHorizontal: 20, 
    paddingBottom: 20, 
    paddingTop: Platform.OS === 'ios' ? 55 : 40, // Laisse couler le fond bleu sous la barre système sans SafeAreaView restrictive
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24, 
    elevation: 4 
  },
  headerTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerAppTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  headerGreetingText: { color: '#93c5fd', fontSize: 13, marginTop: 4, fontWeight: '600' },
  settingsBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tabScrollContent: { padding: 20, paddingBottom: 110 },
  
  welcomeContainer: { padding: 24, justifyContent: 'center', flexGrow: 1, backgroundColor: '#1e3a8a' },
  heroCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 4, marginBottom: 30 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: '#e0f2fe', color: '#1e3a8a', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, fontWeight: '700', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  welcomeScreenButton: {
    width: (width - 60) / 2, 
    height: 55,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    elevation: 3
  },
  welcomeButtonTextBlue: { color: '#1e3a8a', fontWeight: '800', fontSize: 15 },
  welcomeButtonTextWhite: { color: '#fff', fontWeight: '800', fontSize: 15 },

  backButtonInline: { marginBottom: 20, paddingVertical: 5 },
  backButtonText: { color: '#1e3a8a', fontWeight: '700', fontSize: 14 },

  authContent: { padding: 24, paddingBottom: 120, paddingTop: 40 },
  screenTitle: { fontSize: 24, color: '#0f172a', fontWeight: '800', marginBottom: 12 },
  screenDescription: { color: '#64748b', fontSize: 13, marginBottom: 16 },
  inputRow: { flexDirection: 'row' },
  inputBlock: { marginBottom: 14 },
  inputLabel: { fontSize: 13, color: '#1e3a8a', fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderColor: '#cbd5e1', borderWidth: 1, height: 48, borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: '#334155' },
  inputMultiline: { height: 80, textAlignVertical: 'top', paddingTop: 10 },
  
  bloodGroupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  bloodGroupBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', minWidth: 60, alignItems: 'center' },
  bloodGroupBadgeSelected: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  bloodGroupText: { color: '#334155', fontWeight: '700', fontSize: 14 },
  bloodGroupTextSelected: { color: '#fff' },

  mapContainer: { flex: 1 },
  actualMap: { width: '100%', height: '100%' },
  searchBarWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35, // Positionnement propre sous la barre système de la carte
    left: 15,
    right: 15,
    zIndex: 99,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5
  },
  mapSearchInput: { height: 50, paddingHorizontal: 15, fontSize: 15 },
  mapCallout: { backgroundColor: '#fff', padding: 12, borderRadius: 12, width: 220, alignItems: 'center' },
  calloutTitle: { fontWeight: 'bold', fontSize: 15, color: '#1e3a8a' },
  calloutDesc: { fontSize: 13, color: '#475569', marginVertical: 2 },
  calloutDist: { fontSize: 11, color: '#64748b' },
  calloutBtn: { backgroundColor: '#1e3a8a', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 6, marginTop: 8 },
  calloutBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  mapFormOverlay: { position: 'absolute', bottom: 90, left: 15, right: 15, backgroundColor: '#fff', borderRadius: 16, padding: 16, zIndex: 99, elevation: 10 },

  pickerButton: { backgroundColor: '#34495e', padding: 12, borderRadius: 10, alignItems: 'center' },
  pickerButtonText: { color: '#fff', fontWeight: '700' },
  fileSelectedIndicator: { color: '#10b981', marginTop: 5, fontSize: 13, fontWeight: '600' },

  documentViewerBox: { marginTop: 15, padding: 12, backgroundColor: '#eaeffa', borderRadius: 10, borderWidth: 1, borderColor: '#bcd0f7' },
  documentFileName: { color: '#2c3e50', fontWeight: '700', fontSize: 14, marginTop: 4, marginBottom: 8 },
  viewDocButton: { backgroundColor: '#1e3a8a', padding: 8, borderRadius: 6, alignItems: 'center' },
  viewDocButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  primaryButtonAction: { backgroundColor: '#1e3a8a', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', elevation: 2, marginTop: 10 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryButtonAction: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  secondaryButtonText: { color: '#1e3a8a', fontWeight: '700', fontSize: 15 },

  emergencyButton: { backgroundColor: '#dc2626', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  emergencyText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 15, marginBottom: 10 },
  vitalsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  vitalCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', elevation: 1 },
  vitalEmoji: { fontSize: 20 },
  vitalValue: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  vitalLabel: { fontSize: 11, color: '#64748b', textAlign: 'center' },
  tipsCard: { backgroundColor: '#eff6ff', borderLeftWidth: 4, borderLeftColor: '#2563eb', padding: 14, borderRadius: 8 },
  tipsTitle: { fontWeight: '700', color: '#1e3a8a' },
  tipsText: { fontSize: 13, color: '#1e3a8a', marginTop: 4, lineHeight: 18 },
  cardLayout: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 1 },
  symptomRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  symptomSelector: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  symptomSelectorActive: { backgroundColor: '#1e3a8a' },
  symptomText: { color: '#334155', fontWeight: '600' },
  symptomTextActive: { color: '#fff', fontWeight: '700' },
  intensityRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  intensityBox: { width: 30, height: 35, borderBottomWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  intensityBoxActive: { backgroundColor: '#1e3a8a', borderRadius: 4 },
  recommendationBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginTop: 10 },
  serviceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  serviceCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  profileHeaderCard: { alignItems: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 16, marginBottom: 15 },
  avatarPlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  profileTitleText: { fontSize: 18, fontWeight: '800' },
  profileSubText: { color: '#64748b', fontSize: 13 },
  gridContainer: { gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { color: '#64748b', fontWeight: '600' },
  infoValue: { color: '#0f172a', fontWeight: '700' },
  logoutButton: { marginTop: 20, alignItems: 'center' },
  logoutButtonText: { color: '#dc2626', fontWeight: '700' },
  customTabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#fff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingBottom: 10 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  tabLabelActive: { color: '#1e3a8a', fontWeight: '800' }
});
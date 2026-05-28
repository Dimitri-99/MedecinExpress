import 'package:flutter/material.dart';

import 'api_service.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  String query = '';
  bool isLoadingRemote = false;
  List<Map<String, String>> remoteDoctors = [];

  final localDoctors = const [
    {
      'name': 'Dr. Ongolo Amélie ',
      'specialty': 'Pédiatre',
      'availability': 'Disponible maintenant',
    },
    {
      'name': 'Dr. Noumbo Karim ',
      'specialty': 'Urgences',
      'availability': 'Disponible en 10 min',
    },
    {
      'name': 'Dr. Ottou Hélène ',
      'specialty': 'Généraliste',
      'availability': 'Disponible en 25 min',
    },
  ];

  final pharmacies = const [
    {'name': 'Pharmacie des anges', 'status': 'Ouverte'},
    {'name': 'Pharmacie de essos', 'status': 'Ferme dans 45 min'},
    {'name': 'Pharmacie du Ministere', 'status': 'Ouverte 24/7'},
  ];

  List<Map<String, String>> get filteredDoctors {
    final list = remoteDoctors.isNotEmpty ? remoteDoctors : localDoctors;
    if (query.isEmpty) return list;
    return list
        .where(
          (doctor) =>
              doctor['name']!.toLowerCase().contains(query.toLowerCase()) ||
              doctor['specialty']!.toLowerCase().contains(query.toLowerCase()),
        )
        .toList();
  }

  List<Map<String, String>> get filteredPharmacies {
    if (query.isEmpty) return pharmacies;
    return pharmacies
        .where(
          (pharmacy) =>
              pharmacy['name']!.toLowerCase().contains(query.toLowerCase()),
        )
        .toList();
  }

  Future<void> _loadRemoteDoctors() async {
    setState(() {
      isLoadingRemote = true;
    });

    try {
      final response = await ApiService.fetchDoctors();
      setState(() {
        remoteDoctors = response;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Impossible de charger les médecins depuis l’API.'),
        ),
      );
    } finally {
      setState(() {
        isLoadingRemote = false;
      });
    }
  }

  void _setCategory(String value) {
    setState(() {
      query = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Trouve un médecin ou une pharmacie',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Recherche rapide et rendez-vous en quelques secondes.',
              style: TextStyle(fontSize: 16, color: Colors.black54),
            ),
            const SizedBox(height: 20),
            Container(
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(18),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  const Icon(Icons.search, color: Colors.blue),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      onChanged: (value) {
                        setState(() {
                          query = value;
                        });
                      },
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        hintText: 'Symptôme, spécialité, pharmacie...',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: isLoadingRemote ? null : _loadRemoteDoctors,
              icon: isLoadingRemote
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.sync),
              label: Text(
                isLoadingRemote ? 'Chargement...' : 'Actualiser les médecins',
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Catégories rapides',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _IconCard(
                  icon: Icons.local_hospital,
                  label: 'Urgence',
                  onTap: () => _setCategory('Urgences'),
                ),
                _IconCard(
                  icon: Icons.local_pharmacy,
                  label: 'Pharmacie',
                  onTap: () => _setCategory('Pharmacie'),
                ),
                _IconCard(
                  icon: Icons.home,
                  label: 'À domicile',
                  onTap: () => _setCategory('Généraliste'),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text(
              'Médecins disponibles',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            ...filteredDoctors.map((doctor) {
              return _DoctorCard(
                name: doctor['name']!,
                specialty: doctor['specialty']!,
                availability: doctor['availability']!,
                onReserve: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => AppointmentBookingScreen(
                        doctorName: doctor['name']!,
                        specialty: doctor['specialty']!,
                      ),
                    ),
                  );
                },
              );
            }),
            const SizedBox(height: 24),
            const Text(
              'Pharmacies proches',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            ...filteredPharmacies.map((pharmacy) {
              return _PharmacyCard(
                name: pharmacy['name']!,
                openStatus: pharmacy['status']!,
              );
            }),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _IconCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _IconCard({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 28, color: Colors.blue),
              const SizedBox(height: 12),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DoctorCard extends StatelessWidget {
  final String name;
  final String specialty;
  final String availability;
  final VoidCallback onReserve;

  const _DoctorCard({
    required this.name,
    required this.specialty,
    required this.availability,
    required this.onReserve,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 28,
            backgroundColor: Colors.blue,
            child: Icon(Icons.person, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(specialty, style: const TextStyle(color: Colors.black54)),
                const SizedBox(height: 8),
                Text(
                  availability,
                  style: const TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(onPressed: onReserve, child: const Text('Réserver')),
        ],
      ),
    );
  }
}

class _PharmacyCard extends StatelessWidget {
  final String name;
  final String openStatus;

  const _PharmacyCard({required this.name, required this.openStatus});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.local_pharmacy, size: 32, color: Colors.blue),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(openStatus, style: const TextStyle(color: Colors.black54)),
              ],
            ),
          ),
          TextButton(onPressed: () {}, child: const Text('Voir')),
        ],
      ),
    );
  }
}

class AppointmentBookingScreen extends StatefulWidget {
  final String doctorName;
  final String specialty;

  const AppointmentBookingScreen({
    required this.doctorName,
    required this.specialty,
    super.key,
  });

  @override
  State<AppointmentBookingScreen> createState() =>
      _AppointmentBookingScreenState();
}

class _AppointmentBookingScreenState extends State<AppointmentBookingScreen> {
  final List<String> slots = const [
    'Demain 10:00',
    'Demain 14:00',
    'Jeudi 11:00',
    'Vendredi 16:00',
  ];
  String selectedSlot = 'Demain 10:00';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Réservation'), centerTitle: true),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.doctorName,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              widget.specialty,
              style: const TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 24),
            const Text(
              'Choisis un créneau',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            ...slots.map((slot) {
              final selected = slot == selectedSlot;
              return Card(
                color: selected ? Colors.blue.shade50 : Colors.white,
                child: ListTile(
                  title: Text(slot),
                  trailing: selected
                      ? const Icon(Icons.check, color: Colors.blue)
                      : null,
                  onTap: () => setState(() => selectedSlot = slot),
                ),
              );
            }),
            const Spacer(),
            ElevatedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Rendez-vous confirmé le $selectedSlot avec ${widget.doctorName}.',
                    ),
                  ),
                );
                Navigator.pop(context);
              },
              child: const Text('Confirmer la réservation'),
            ),
          ],
        ),
      ),
    );
  }
}

class TriageScreen extends StatefulWidget {
  const TriageScreen({super.key});

  @override
  State<TriageScreen> createState() => _TriageScreenState();
}

class _TriageScreenState extends State<TriageScreen> {
  final symptoms = const [
    'Fièvre',
    'Toux',
    'Mal de tête',
    'Frotement',
    'Fatigue',
  ];
  final severities = const ['Légère', 'Modérée', 'Sévère'];
  final durations = const ['Moins de 24h', '2-3 jours', 'Plus de 3 jours'];

  int step = 0;
  String selectedSymptom = 'Fièvre';
  String selectedSeverity = 'Légère';
  String selectedDuration = 'Moins de 24h';

  String get advice {
    if (step < 3) return '';

    final symptomText = selectedSymptom.toLowerCase();
    final severityText = selectedSeverity.toLowerCase();
    final durationText = selectedDuration.toLowerCase();

    if (symptomText == 'fièvre' && severityText == 'sévère') {
      return 'Surveille ta température et consulte rapidement un médecin si elle dépasse 38,5°C.';
    }
    if (symptomText == 'frotement' && durationText == 'plus de 3 jours') {
      return 'Le frotement persistant mérite une consultation médicale. Prends rendez-vous rapidement.';
    }
    if (symptomText == 'toux' && severityText != 'légère') {
      return 'Bois beaucoup d’eau et consulte si la toux ne s’améliore pas dans 2 jours.';
    }
    return 'Repos, hydratation et suivi des symptômes. Si cela ne passe pas, consulte un médecin.';
  }

  void _nextStep() {
    setState(() {
      if (step < 3) step += 1;
    });
  }

  void _previousStep() {
    setState(() {
      if (step > 0) step -= 1;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Triage IA',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              step < 3 ? 'Étape ${step + 1} sur 4' : 'Résultat du triage',
              style: const TextStyle(fontSize: 16, color: Colors.black54),
            ),
            const SizedBox(height: 20),
            if (step == 0) ...[
              const Text(
                'Quel symptôme ressens-tu ?',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: symptoms.map((symptom) {
                  final selected = symptom == selectedSymptom;
                  return ChoiceChip(
                    label: Text(symptom),
                    selected: selected,
                    onSelected: (_) =>
                        setState(() => selectedSymptom = symptom),
                  );
                }).toList(),
              ),
            ] else if (step == 1) ...[
              const Text(
                'Quelle intensité ?',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: severities.map((severity) {
                  final selected = severity == selectedSeverity;
                  return ChoiceChip(
                    label: Text(severity),
                    selected: selected,
                    onSelected: (_) =>
                        setState(() => selectedSeverity = severity),
                  );
                }).toList(),
              ),
            ] else if (step == 2) ...[
              const Text(
                'Depuis combien de temps ?',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: durations.map((duration) {
                  final selected = duration == selectedDuration;
                  return ChoiceChip(
                    label: Text(duration),
                    selected: selected,
                    onSelected: (_) =>
                        setState(() => selectedDuration = duration),
                  );
                }).toList(),
              ),
            ] else ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Conseil',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Colors.blue.shade900,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      advice,
                      style: const TextStyle(
                        fontSize: 16,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const AppointmentBookingScreen(
                        doctorName: 'Consultation rapide',
                        specialty: 'Triage IA',
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.calendar_month),
                label: const Text('Réserver une consultation'),
              ),
            ],
            const Spacer(),
            Row(
              children: [
                if (step > 0)
                  OutlinedButton(
                    onPressed: _previousStep,
                    child: const Text('Précédent'),
                  ),
                const Spacer(),
                ElevatedButton(
                  onPressed: step < 3 ? _nextStep : null,
                  child: Text(step < 3 ? 'Suivant' : 'Terminé'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class FollowUpScreen extends StatelessWidget {
  const FollowUpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Suivi des consultations',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Retrouve ton historique et tes prochains rendez-vous.',
              style: TextStyle(fontSize: 16, color: Colors.black54),
            ),
            const SizedBox(height: 20),
            const _AppointmentCard(
              title: 'Consultation avec Dr. Dubois',
              subtitle: 'Mardi 28 mai - 15:00',
              status: 'Confirmée',
            ),
            const _AppointmentCard(
              title: 'Téléconsultation généraliste',
              subtitle: 'Vendredi 31 mai - 11:00',
              status: 'À venir',
            ),
            const SizedBox(height: 24),
            const Text(
              'Conseils santé',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            const _InfoTile(
              icon: Icons.medical_information,
              title: 'Prends tes médicaments à l’heure',
              subtitle: 'Active les rappels pour les traitements en cours.',
            ),
            const _InfoTile(
              icon: Icons.water,
              title: 'Hydrate-toi régulièrement',
              subtitle: 'Bois au moins de l’eau par jour.',
            ),
          ],
        ),
      ),
    );
  }
}

class MedicalRecordScreen extends StatelessWidget {
  const MedicalRecordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Dossier médical',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Toutes tes informations de santé en un seul endroit.',
              style: TextStyle(fontSize: 16, color: Colors.black54),
            ),
            const SizedBox(height: 20),
            const _RecordTile(title: 'Nom', value: 'FOPA DIMITRI'),
            const _RecordTile(title: 'Âge', value: '20 ans'),
            const _RecordTile(title: 'Allergies', value: 'Aucune connue'),
            const _RecordTile(title: 'Groupe sanguin', value: 'O+'),
            const SizedBox(height: 24),
            const Text(
              'Documents importants',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            const _DocumentCard(
              title: 'Ordonnance récente',
              subtitle: 'Télécharger',
            ),
            const _DocumentCard(
              title: 'Résultat analyse sanguine',
              subtitle: 'Télécharger',
            ),
          ],
        ),
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String status;

  const _AppointmentCard({
    required this.title,
    required this.subtitle,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.calendar_today, color: Colors.blue, size: 30),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(color: Colors.black54)),
              ],
            ),
          ),
          Text(
            status,
            style: const TextStyle(
              color: Colors.blue,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _InfoTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.blue, size: 30),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(color: Colors.black54)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RecordTile extends StatelessWidget {
  final String title;
  final String value;

  const _RecordTile({required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(value, style: const TextStyle(color: Colors.black54)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Colors.blue),
        ],
      ),
    );
  }
}

class _DocumentCard extends StatelessWidget {
  final String title;
  final String subtitle;

  const _DocumentCard({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.description, color: Colors.blue, size: 30),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(color: Colors.black54)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

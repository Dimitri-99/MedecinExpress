import 'package:flutter/material.dart';
import 'home_widgets.dart';

void main() {
  runApp(const MedecinExpressApp());
}

class MedecinExpressApp extends StatelessWidget {
  const MedecinExpressApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MédecinExpress',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const SearchScreen(),
    const TriageScreen(),
    const FollowUpScreen(),
    const MedicalRecordScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '💙 MédecinExpress',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.blue,
        unselectedItemColor: Colors.grey,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.local_hospital),
            label: 'Soins',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.psychology),
            label: 'Triage IA',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_month),
            label: 'Suivi',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.folder_shared),
            label: 'Dossier',
          ),
        ],
      ),
    );
  }
}

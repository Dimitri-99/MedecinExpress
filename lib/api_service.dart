import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiService {
  static Future<List<Map<String, String>>> fetchDoctors() async {
    final uri = Uri.parse('https://jsonplaceholder.typicode.com/users');
    final response = await http.get(uri);

    if (response.statusCode != 200) {
      throw Exception('Erreur API ${response.statusCode}');
    }

    final data = jsonDecode(response.body) as List<dynamic>;
    return data.take(5).map<Map<String, String>>((item) {
      final map = item as Map<String, dynamic>;
      return {
        'name': map['name']?.toString() ?? 'Médecin inconnu',
        'specialty': 'Généraliste',
        'availability': 'Disponible maintenant',
      };
    }).toList();
  }
}

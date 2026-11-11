import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 1. KRITERIA 1: PEMBUATAN INTERFACE
interface Todo {
  id: string;
  task: string;
  completed: boolean;
}

const API_URL = "https://jsonplaceholder.typicode.com/todos";

export default function TodoScreen() {
  // Penggunaan Interface pada State
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [taskInput, setTaskInput] = useState("");

  // 2. KRITERIA 3: CUSTOM PROMISE DENGAN resolve() DAN reject()
  const validateTaskInput = (input: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (input.trim().length > 0) {
        resolve(input.trim());
      } else {
        reject("Deskripsi tugas tidak boleh kosong");
      }
    });
  };

  // 3. KRITERIA 3: PENGGUNAAN FUNGSI .then()
  const loadTodosWithThen = () => {
    fetch(`${API_URL}?_limit=6`)
      .then((response) => response.json())
      .then((data) => {
        const formattedData: Todo[] = data.map((item: any) => ({
          id: item.id.toString(),
          task: item.title,
          completed: item.completed,
        }));

        const sampleTodos: Todo[] = [
          { id: "inv-1", task: "Belajar React Native", completed: false },
          { id: "inv-2", task: "Buat aplikasi Todo", completed: true },
          { id: "inv-3", task: "Update materi kuliah", completed: false },
          ...formattedData,
        ];

        setTodos(sampleTodos);
      })
      .catch((error) => {
        Alert.alert("Error API", "Gagal mengambil data tugas");
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadTodosWithThen();
  }, []);

  // 4. KRITERIA 2: PRE-BUILT & CUSTOM ASYNC FUNCTION (async/await)
  const addTodo = async () => {
    try {
      // Menggunakan validasi dengan Promise resolve/reject
      const validText = await validateTaskInput(taskInput);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: validText, completed: false }),
      });

      if (response.ok) {
        const newTodoItem: Todo = {
          id: Date.now().toString(),
          task: validText,
          completed: false,
        };
        setTodos([newTodoItem, ...todos]);
        setTaskInput("");
      }
    } catch (error) {
      Alert.alert("Peringatan", error as string);
    }
  };

  const toggleTodo = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      setTodos(
        todos.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item,
        ),
      );
    } catch (error) {
      Alert.alert("Error API", "Gagal memperbarui status tugas");
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      setTodos(todos.filter((item) => item.id !== id));
    } catch (error) {
      Alert.alert("Error API", "Gagal menghapus tugas");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTodosWithThen();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={{ marginTop: 10, color: "#64748B" }}>
          Memuat Todo App...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCheckIcon}>
          <Ionicons name="checkmark-sharp" size={20} color="#0066FF" />
        </View>
        <Text style={styles.headerTitle}>Todo App</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Tambah tugas baru..."
            placeholderTextColor="#94A3B8"
            value={taskInput}
            onChangeText={setTaskInput}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={addTodo}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Tambah</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0066FF"]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.todoCard}>
              <TouchableOpacity
                style={styles.todoLeftSection}
                onPress={() => toggleTodo(item.id, item.completed)}
                activeOpacity={0.7}
              >
                {item.completed ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={26}
                    color="#0066FF"
                    style={styles.radioIcon}
                  />
                ) : (
                  <Ionicons
                    name="ellipse-outline"
                    size={26}
                    color="#94A3B8"
                    style={styles.radioIcon}
                  />
                )}
                <Text
                  style={[
                    styles.todoText,
                    item.completed && styles.completedText,
                  ]}
                >
                  {item.task}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => deleteTodo(item.id)}
                activeOpacity={0.6}
              >
                <Ionicons name="trash-outline" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFF6FF" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
  },
  header: {
    backgroundColor: "#0066FF",
    paddingTop: 45,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  headerCheckIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  inputCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    height: 44,
    color: "#0F172A",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#0066FF",
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
  },
  addButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },
  todoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  todoLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  radioIcon: { marginRight: 12 },
  todoText: { fontSize: 15, color: "#1E293B", fontWeight: "500" },
  completedText: { textDecorationLine: "line-through", color: "#94A3B8" },
});

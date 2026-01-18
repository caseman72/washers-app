//
//  ColorPickerView.swift
//  washers
//

import SwiftUI

struct ColorPickerView: View {
    @Binding var selectedColor: String
    let otherColor: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List(WasherColor.all) { color in
                let isDisabled = color.id == otherColor.lowercased()
                let isSelected = color.id == selectedColor.lowercased()

                Button(action: {
                    if !isDisabled {
                        selectedColor = color.id
                        dismiss()
                    }
                }) {
                    HStack(spacing: 16) {
                        Circle()
                            .fill(color.background)
                            .frame(width: 40, height: 40)
                            .overlay(
                                Circle()
                                    .stroke(color.id == "white" ? Color.gray.opacity(0.3) : Color.clear, lineWidth: 2)
                            )

                        Text(color.name)
                            .foregroundColor(isDisabled ? .gray : .primary)

                        Spacer()

                        if isSelected {
                            Image(systemName: "checkmark")
                                .foregroundColor(.green)
                                .fontWeight(.semibold)
                        }
                    }
                }
                .disabled(isDisabled)
                .opacity(isDisabled ? 0.4 : 1)
            }
            .navigationTitle("Choose Color")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    ColorPickerView(
        selectedColor: .constant("orange"),
        otherColor: "black"
    )
}
